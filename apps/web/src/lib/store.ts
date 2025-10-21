/**
 * Global state management with Zustand
 */

import { create } from 'zustand';
import * as sdk from 'matrix-js-sdk';

interface Room {
  id: string;
  name: string;
  lastMessage?: string;
  unreadCount: number;
  timestamp: number;
}

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: number;
  isOwn: boolean;
}

interface Draft {
  content: string;
  status: 'suggest' | 'prompt' | 'final' | 'diff';
  originalContent?: string;
}

interface Store {
  // Matrix client
  client: sdk.MatrixClient | null;
  isAuthenticated: boolean;
  userId: string | null;
  
  // Rooms
  rooms: Room[];
  selectedRoomId: string | null;
  
  // Messages
  messages: Message[];
  
  // AI Draft
  draft: Draft | null;
  
  // Actions
  initializeClient: () => Promise<void>;
  login: (homeserver: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  selectRoom: (roomId: string) => void;
  loadMessages: (roomId: string) => Promise<void>;
  sendMessage: (roomId: string, content: string) => Promise<void>;
  setDraft: (draft: Draft | null) => void;
  generateDraft: (roomId: string, prompt?: string) => Promise<void>;
}

export const useStore = create<Store>((set, get) => ({
  client: null,
  isAuthenticated: false,
  userId: null,
  rooms: [],
  selectedRoomId: null,
  messages: [],
  draft: null,

  initializeClient: async () => {
    // Try to restore from localStorage
    const savedSession = localStorage.getItem('matrix_session');
    if (!savedSession) return;

    try {
      const session = JSON.parse(savedSession);
      const client = sdk.createClient({
        baseUrl: session.homeserver,
        accessToken: session.accessToken,
        userId: session.userId
      });

      // Enable E2EE
      await client.initCrypto();
      
      await client.startClient({ initialSyncLimit: 10 });

      set({
        client,
        isAuthenticated: true,
        userId: session.userId
      });

      // Load rooms
      client.on('sync', (state) => {
        if (state === 'PREPARED') {
          const rooms = client.getRooms().map(room => ({
            id: room.roomId,
            name: room.name || 'Unnamed Room',
            lastMessage: room.timeline[room.timeline.length - 1]?.getContent()?.body,
            unreadCount: room.getUnreadNotificationCount(),
            timestamp: room.timeline[room.timeline.length - 1]?.getDate().getTime() || 0
          }));
          set({ rooms: rooms.sort((a, b) => b.timestamp - a.timestamp) });
        }
      });
    } catch (error) {
      console.error('Failed to restore session:', error);
      localStorage.removeItem('matrix_session');
    }
  },

  login: async (homeserver, username, password) => {
    try {
      const client = sdk.createClient({ baseUrl: homeserver });
      const response = await client.login('m.login.password', {
        user: username,
        password
      });

      // Save session
      localStorage.setItem('matrix_session', JSON.stringify({
        homeserver,
        accessToken: response.access_token,
        userId: response.user_id
      }));

      // Initialize with new credentials
      const authClient = sdk.createClient({
        baseUrl: homeserver,
        accessToken: response.access_token,
        userId: response.user_id
      });

      // Enable E2EE
      await authClient.initCrypto();
      await authClient.startClient({ initialSyncLimit: 10 });

      set({
        client: authClient,
        isAuthenticated: true,
        userId: response.user_id
      });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  logout: async () => {
    const { client } = get();
    if (client) {
      await client.logout();
      client.stopClient();
    }
    localStorage.removeItem('matrix_session');
    set({
      client: null,
      isAuthenticated: false,
      userId: null,
      rooms: [],
      selectedRoomId: null,
      messages: []
    });
  },

  selectRoom: (roomId: string) => {
    set({ selectedRoomId: roomId });
    get().loadMessages(roomId);
  },

  loadMessages: async (roomId: string) => {
    const { client, userId } = get();
    if (!client) return;

    const room = client.getRoom(roomId);
    if (!room) return;

    const messages = room.timeline
      .filter(e => e.getType() === 'm.room.message')
      .map(e => ({
        id: e.getId()!,
        sender: e.getSender()!,
        content: e.getContent().body || '',
        timestamp: e.getDate()!.getTime(),
        isOwn: e.getSender() === userId
      }));

    set({ messages });
  },

  sendMessage: async (roomId: string, content: string) => {
    const { client } = get();
    if (!client) return;

    await client.sendMessage(roomId, {
      msgtype: 'm.text',
      body: content
    });

    // Reload messages
    get().loadMessages(roomId);
  },

  setDraft: (draft: Draft | null) => {
    set({ draft });
  },

  generateDraft: async (roomId: string, prompt?: string) => {
    try {
      const response = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, prompt })
      });

      if (!response.ok) throw new Error('AI request failed');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let content = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              content += parsed.token || '';
              set({ draft: { content, status: 'suggest' } });
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      set({ draft: { content, status: 'final' } });
    } catch (error) {
      console.error('Generate draft failed:', error);
      throw error;
    }
  }
}));

