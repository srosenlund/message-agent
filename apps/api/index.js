#!/usr/bin/env node
/**
 * InboxForge AIO API
 * Hono-based API with AI streaming and Matrix integration
 */

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { streamSSE } from 'hono/streaming';
import OpenAI from 'openai';
import * as sdk from 'matrix-js-sdk';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const app = new Hono();

// Configuration
const CONFIG = {
  port: parseInt(process.env.API_PORT || '3000', 10),
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview'
  },
  matrix: {
    homeserverUrl: process.env.MATRIX_HOMESERVER_URL || 'http://localhost:6167',
    accessToken: process.env.MATRIX_BOT_TOKEN
  },
  bridge: {
    outlookUrl: process.env.BRIDGE_OUTLOOK_URL || 'http://localhost:9000'
  }
};

// OpenAI client
const openai = new OpenAI({
  apiKey: CONFIG.openai.apiKey
});

// Matrix client
let matrixClient = null;
if (CONFIG.matrix.accessToken) {
  matrixClient = sdk.createClient({
    baseUrl: CONFIG.matrix.homeserverUrl,
    accessToken: CONFIG.matrix.accessToken
  });
}

// ============================================================================
// Middleware
// ============================================================================

app.use('*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (c.req.method === 'OPTIONS') {
    return c.text('', 204);
  }
  
  await next();
});

// Request logging
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${c.req.method} ${c.req.path} - ${c.res.status} (${ms}ms)`);
});

// ============================================================================
// Routes
// ============================================================================

// Health check
app.get('/api/health', (c) => {
  return c.json({
    status: 'healthy',
    version: '1.0.0',
    services: {
      openai: !!CONFIG.openai.apiKey,
      matrix: !!matrixClient,
      bridge: true
    },
    timestamp: new Date().toISOString()
  });
});

// AI Draft Suggestion - SSE Streaming
app.post('/api/ai/suggest', async (c) => {
  try {
    const body = await c.req.json();
    const { roomId, prompt, threadContext, temperature = 0.7, maxTokens = 500 } = body;

    if (!CONFIG.openai.apiKey) {
      return c.json({ error: 'OpenAI API key not configured' }, 503);
    }

    // Get room context from Matrix
    let contextMessages = [];
    if (matrixClient && roomId) {
      try {
        const timeline = await matrixClient.roomInitialSync(roomId, 10);
        contextMessages = timeline.messages.chunk
          .filter(e => e.type === 'm.room.message')
          .map(e => ({
            role: e.sender === matrixClient.getUserId() ? 'assistant' : 'user',
            content: e.content.body
          }));
      } catch (err) {
        console.error('Failed to fetch Matrix context:', err);
      }
    }

    // Build messages for OpenAI
    const messages = [
      {
        role: 'system',
        content: 'You are an AI assistant helping to draft professional email responses. Be concise, clear, and professional. Match the tone of the conversation.'
      },
      ...contextMessages,
      {
        role: 'user',
        content: prompt || 'Draft a response to the above email thread.'
      }
    ];

    // Stream response via SSE
    return streamSSE(c, async (stream) => {
      try {
        const completion = await openai.chat.completions.create({
          model: CONFIG.openai.model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: true
        });

        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            await stream.writeSSE({
              data: JSON.stringify({ token: content }),
              event: 'token'
            });
          }
        }

        await stream.writeSSE({
          data: '[DONE]',
          event: 'done'
        });
      } catch (error) {
        console.error('OpenAI streaming error:', error);
        await stream.writeSSE({
          data: JSON.stringify({ error: error.message }),
          event: 'error'
        });
      }
    });
  } catch (error) {
    console.error('AI suggest error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Send Email via Outlook Bridge
app.post('/api/send/outlook', async (c) => {
  try {
    const body = await c.req.json();
    const { roomId, html, inReplyTo } = body;

    if (!roomId || !html) {
      return c.json({ error: 'roomId and html are required' }, 400);
    }

    // Send to Matrix room first
    if (matrixClient) {
      await matrixClient.sendHtmlMessage(roomId, html, html);
    }

    // Forward to bridge (bridge will handle actual email sending)
    const bridgeResponse = await fetch(`${CONFIG.bridge.outlookUrl}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, content: html, inReplyTo })
    });

    if (!bridgeResponse.ok) {
      throw new Error(`Bridge returned ${bridgeResponse.status}`);
    }

    return c.json({
      success: true,
      messageId: `${roomId}_${Date.now()}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Send outlook error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get Matrix rooms
app.get('/api/rooms', async (c) => {
  if (!matrixClient) {
    return c.json({ error: 'Matrix client not configured' }, 503);
  }

  try {
    const rooms = matrixClient.getRooms();
    return c.json({
      rooms: rooms.map(room => ({
        id: room.roomId,
        name: room.name,
        topic: room.currentState.getStateEvents('m.room.topic', '')?.getContent()?.topic,
        unreadCount: room.getUnreadNotificationCount(),
        lastMessage: room.timeline[room.timeline.length - 1]?.getContent()?.body
      }))
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get room messages
app.get('/api/rooms/:roomId/messages', async (c) => {
  const { roomId } = c.req.param();
  
  if (!matrixClient) {
    return c.json({ error: 'Matrix client not configured' }, 503);
  }

  try {
    const room = matrixClient.getRoom(roomId);
    if (!room) {
      return c.json({ error: 'Room not found' }, 404);
    }

    const messages = room.timeline
      .filter(e => e.getType() === 'm.room.message')
      .map(e => ({
        id: e.getId(),
        sender: e.getSender(),
        content: e.getContent(),
        timestamp: e.getDate().toISOString()
      }));

    return c.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// Start Server
// ============================================================================

console.log('🚀 Starting InboxForge API...');
console.log(`   OpenAI: ${CONFIG.openai.apiKey ? '✅' : '❌'}`);
console.log(`   Matrix: ${matrixClient ? '✅' : '❌'}`);
console.log(`   Bridge: ${CONFIG.bridge.outlookUrl}`);

serve({
  fetch: app.fetch,
  port: CONFIG.port
}, (info) => {
  console.log(`✅ API listening on http://localhost:${info.port}`);
});

