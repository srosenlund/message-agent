#!/usr/bin/env node
/**
 * Outlook Graph Appservice Bridge
 * Bridges Microsoft Outlook emails to Matrix rooms using Microsoft Graph API
 */

import { Bridge, Intent, AppServiceRegistration } from 'matrix-appservice-bridge';
import { Client } from '@microsoft/microsoft-graph-client';
import { ConfidentialClientApplication } from '@azure/msal-node';
import express from 'express';
import { readFileSync } from 'fs';
import yaml from 'yaml';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const CONFIG = {
  homeserverUrl: process.env.MATRIX_HOMESERVER_URL || 'http://localhost:6167',
  domain: process.env.MATRIX_SERVER_NAME || 'localhost',
  registrationPath: '/data/appservices/outlook.yaml',
  
  graph: {
    clientId: process.env.GRAPH_CLIENT_ID,
    clientSecret: process.env.GRAPH_CLIENT_SECRET,
    tenantId: process.env.GRAPH_TENANT_ID || 'common',
    redirectUri: process.env.GRAPH_REDIRECT_URI || 'http://localhost:9000/oauth/callback',
    scopes: ['https://graph.microsoft.com/Mail.Read', 'https://graph.microsoft.com/Mail.Send', 'offline_access']
  },
  
  port: parseInt(process.env.BRIDGE_PORT || '9000', 10),
  stateDir: '/data/bridges/outlook'
};

// MSAL Client for OAuth
const msalClient = new ConfidentialClientApplication({
  auth: {
    clientId: CONFIG.graph.clientId,
    authority: `https://login.microsoftonline.com/${CONFIG.graph.tenantId}`,
    clientSecret: CONFIG.graph.clientSecret
  }
});

class OutlookBridge {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.graphClient = null;
    this.subscription = null;
  }

  async start() {
    console.log('🚀 Starting Outlook Bridge...');

    // Load registration
    const regContent = readFileSync(CONFIG.registrationPath, 'utf8');
    const registration = AppServiceRegistration.fromObject(yaml.parse(regContent));

    // Create bridge
    this.bridge = new Bridge({
      homeserverUrl: CONFIG.homeserverUrl,
      domain: CONFIG.domain,
      registration,
      controller: {
        onUserQuery: this.onUserQuery.bind(this),
        onAliasQuery: this.onAliasQuery.bind(this),
        onEvent: this.onEvent.bind(this),
      }
    });

    // Setup Express routes
    const app = this.bridge.opts.controller.app || express();
    this.setupRoutes(app);

    // Run bridge
    await this.bridge.run(CONFIG.port);
    console.log(`✅ Outlook Bridge listening on port ${CONFIG.port}`);

    // Authenticate with Microsoft Graph
    await this.authenticate();
  }

  setupRoutes(app) {
    // OAuth callback
    app.get('/oauth/callback', async (req, res) => {
      try {
        const { code } = req.query;
        const tokenResponse = await msalClient.acquireTokenByCode({
          code,
          scopes: CONFIG.graph.scopes,
          redirectUri: CONFIG.graph.redirectUri
        });

        this.accessToken = tokenResponse.accessToken;
        this.refreshToken = tokenResponse.refreshToken;
        
        // Initialize Graph client
        this.graphClient = Client.init({
          authProvider: (done) => {
            done(null, this.accessToken);
          }
        });

        // Setup subscription for new emails
        await this.setupSubscription();

        res.send('✅ Authenticated successfully! You can close this window.');
      } catch (error) {
        console.error('OAuth callback error:', error);
        res.status(500).send('Authentication failed');
      }
    });

    // Webhook for Graph notifications
    app.post('/webhook/graph', express.json(), async (req, res) => {
      try {
        // Validate webhook
        if (req.query.validationToken) {
          return res.send(req.query.validationToken);
        }

        // Process notifications
        const notifications = req.body.value || [];
        for (const notification of notifications) {
          await this.handleEmailNotification(notification);
        }

        res.sendStatus(202);
      } catch (error) {
        console.error('Webhook error:', error);
        res.sendStatus(500);
      }
    });

    // Manual auth initiation
    app.get('/auth/start', (req, res) => {
      const authUrl = msalClient.getAuthCodeUrl({
        scopes: CONFIG.graph.scopes,
        redirectUri: CONFIG.graph.redirectUri
      });
      res.redirect(authUrl);
    });
  }

  async authenticate() {
    if (this.refreshToken) {
      try {
        const tokenResponse = await msalClient.acquireTokenByRefreshToken({
          refreshToken: this.refreshToken,
          scopes: CONFIG.graph.scopes
        });
        this.accessToken = tokenResponse.accessToken;
        
        this.graphClient = Client.init({
          authProvider: (done) => done(null, this.accessToken)
        });
        
        console.log('✅ Refreshed Graph access token');
      } catch (error) {
        console.error('Token refresh failed:', error);
        console.log('Please visit /auth/start to re-authenticate');
      }
    } else {
      console.log('🔐 No refresh token. Visit http://localhost:9000/auth/start to authenticate');
    }
  }

  async setupSubscription() {
    if (!this.graphClient) return;

    try {
      // Create webhook subscription for inbox
      const subscription = {
        changeType: 'created',
        notificationUrl: `${CONFIG.graph.redirectUri.replace('/oauth/callback', '')}/webhook/graph`,
        resource: 'me/mailFolders(\'Inbox\')/messages',
        expirationDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        clientState: 'inboxforge-secret'
      };

      this.subscription = await this.graphClient
        .api('/subscriptions')
        .post(subscription);

      console.log('✅ Graph subscription created:', this.subscription.id);
    } catch (error) {
      console.error('Failed to create subscription:', error);
    }
  }

  async handleEmailNotification(notification) {
    if (!this.graphClient) return;

    try {
      // Fetch the email details
      const message = await this.graphClient
        .api(`/me/messages/${notification.resourceData.id}`)
        .get();

      // Create or get Matrix room for this email thread
      const roomId = await this.getOrCreateRoom(message);

      // Send message to Matrix room
      const intent = this.bridge.getIntent(`@outlook_${message.from.emailAddress.address}:${CONFIG.domain}`);
      await intent.sendMessage(roomId, {
        msgtype: 'm.text',
        body: message.bodyPreview,
        format: 'org.matrix.custom.html',
        formatted_body: message.body.content,
        'com.inboxforge.email': {
          id: message.id,
          subject: message.subject,
          from: message.from.emailAddress,
          to: message.toRecipients.map(r => r.emailAddress),
          receivedDateTime: message.receivedDateTime
        }
      });

      console.log(`📧 Bridged email to room ${roomId}`);
    } catch (error) {
      console.error('Error handling email notification:', error);
    }
  }

  async getOrCreateRoom(message) {
    const alias = `#outlook_${message.conversationId}:${CONFIG.domain}`;
    
    try {
      const room = await this.bridge.getIntent().resolveRoom(alias);
      return room.roomId;
    } catch {
      // Room doesn't exist, create it
      const intent = this.bridge.getIntent();
      const roomId = await intent.createRoom({
        createAsClient: true,
        options: {
          name: message.subject,
          room_alias_name: `outlook_${message.conversationId}`,
          topic: `Email thread: ${message.subject}`,
          preset: 'private_chat'
        }
      });
      
      return roomId.room_id;
    }
  }

  async sendEmail(roomId, content, inReplyTo) {
    if (!this.graphClient) {
      throw new Error('Not authenticated with Microsoft Graph');
    }

    // Get room details to find email thread
    const roomState = await this.bridge.getIntent().getStateEvent(roomId, 'com.inboxforge.thread', '');
    const threadId = roomState?.threadId || null;

    const emailData = {
      message: {
        subject: roomState?.subject || 'New Message',
        body: {
          contentType: 'HTML',
          content: content
        },
        toRecipients: roomState?.participants || []
      }
    };

    if (inReplyTo) {
      emailData.message.inReplyTo = inReplyTo;
    }

    await this.graphClient
      .api('/me/sendMail')
      .post(emailData);

    console.log(`📤 Sent email from room ${roomId}`);
  }

  async onUserQuery(user) {
    return {}; // Auto-provision users
  }

  async onAliasQuery(alias) {
    return {}; // Auto-provision aliases
  }

  async onEvent(request, context) {
    const event = request.getData();
    
    // Handle specific event types if needed
    if (event.type === 'm.room.message' && event.content.msgtype === 'm.text') {
      // Could implement Matrix -> Email here if needed
    }
  }
}

// Start bridge
const bridge = new OutlookBridge();
bridge.start().catch(err => {
  console.error('Failed to start bridge:', err);
  process.exit(1);
});

