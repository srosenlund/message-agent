# InboxForge AIO - Setup Guide

## 🚀 Quick Start

InboxForge is an all-in-one Matrix-powered email client that bridges Microsoft Outlook with a modern web interface and AI-powered draft suggestions.

### Prerequisites

- Docker and Docker Compose
- OpenAI API key (for AI features)
- Microsoft Azure app registration (for Outlook integration)

---

## 📋 Setup Steps

### 1. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure:

**Required:**
- `MATRIX_SERVER_NAME` - Your domain or `localhost`
- `REGISTRATION_TOKEN` - Secret token for Matrix registration
- `OPENAI_API_KEY` - Your OpenAI API key
- `GRAPH_CLIENT_ID` - Azure app client ID
- `GRAPH_CLIENT_SECRET` - Azure app client secret

### 2. Azure App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations** → **New registration**
3. Set redirect URI: `http://localhost:9000/oauth/callback` (change for production)
4. Under **Certificates & secrets**, create a new client secret
5. Under **API permissions**, add:
   - `Mail.Read`
   - `Mail.Send`
   - `offline_access`
6. Copy the client ID and secret to your `.env` file

### 3. Build and Start

```bash
# Build the Docker image
docker-compose build

# Start the container
docker-compose up -d

# View logs
docker-compose logs -f
```

### 4. Register Matrix User

Once the container is running:

```bash
# Access the container
docker exec -it inboxforge-aio /bin/sh

# Register admin user
curl -X POST http://localhost:6167/_matrix/client/r0/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your-secure-password",
    "admin": true,
    "type": "m.login.password"
  }'
```

### 5. Configure Bridge

Generate appservice registration:

```bash
docker exec -it inboxforge-aio node /app/bridge-outlook/register.js
```

Copy the generated tokens to your `.env` file and restart:

```bash
docker-compose restart
```

### 6. Authenticate with Outlook

1. Open browser to: `http://localhost:9000/auth/start`
2. Sign in with your Microsoft account
3. Grant permissions
4. You should see "Authenticated successfully!"

---

## 🌐 Access

- **Web Interface**: http://localhost:8080
- **API**: http://localhost:8080/api
- **Matrix Homeserver**: http://localhost:8080/_matrix
- **Conduit Direct**: http://localhost:6167

---

## ⌨️ Keyboard Shortcuts

The web interface supports vim-style keyboard shortcuts:

- `j` / `k` - Navigate rooms (down/up)
- `r` - Toggle reply/draft panel
- `s` - Generate AI suggestion
- `v` - Verify and lock draft
- `Cmd+Enter` - Send locked message

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                    Nginx :8080                  │
│  ┌───────────┬────────────┬──────────────────┐ │
│  │  React    │    API     │    Matrix        │ │
│  │   PWA     │   :3000    │   (Conduit)      │ │
│  │           │            │    :6167         │ │
│  └───────────┴────────────┴──────────────────┘ │
└─────────────────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
    ┌─────▼──────┐      ┌──────▼────────┐
    │  OpenAI    │      │    Outlook    │
    │    API     │      │    Bridge     │
    │            │      │     :9000     │
    └────────────┘      └───────┬───────┘
                                │
                        ┌───────▼────────┐
                        │  Microsoft     │
                        │  Graph API     │
                        └────────────────┘
```

### Components

1. **Conduit** - Lightweight Matrix homeserver (Rust)
2. **Outlook Bridge** - AppService bridge for Microsoft Graph API
3. **API** - Hono-based REST API with OpenAI integration
4. **Web PWA** - React + TypeScript frontend
5. **Nginx** - Reverse proxy and static file server

---

## 🔧 Development

### Local Development (without Docker)

**Terminal 1 - Conduit:**
```bash
# Install Conduit separately or use existing homeserver
conduit
```

**Terminal 2 - API:**
```bash
cd apps/api
npm install
npm run dev
```

**Terminal 3 - Bridge:**
```bash
cd apps/bridge-outlook
npm install
npm run register  # First time only
npm start
```

**Terminal 4 - Web:**
```bash
cd apps/web
npm install
npm run dev
```

### Project Structure

```
message-agent/
├── apps/
│   ├── api/              # Hono API server
│   ├── bridge-outlook/   # Matrix AppService bridge
│   └── web/              # React PWA
├── config/
│   ├── conduit/          # Conduit configuration
│   ├── nginx/            # Nginx configuration
│   └── s6-overlay/       # Process supervisor
├── data/                 # Persistent data (volumes)
├── Dockerfile            # Multi-stage build
└── docker-compose.yml    # Orchestration
```

---

## 📊 Features

✅ **Matrix Protocol** - Standards-based messaging  
✅ **Outlook Integration** - Bidirectional email sync  
✅ **AI Drafts** - OpenAI-powered response generation  
✅ **SSE Streaming** - Real-time AI suggestions  
✅ **PWA Support** - Install as native app  
✅ **Keyboard Shortcuts** - Vim-style navigation  
✅ **E2EE Ready** - End-to-end encryption support  
✅ **Single Container** - Easy deployment  

---

## 🔐 Security Notes

1. **Change default tokens** in production
2. **Use HTTPS** with proper certificates
3. **Enable firewall** rules
4. **Rotate secrets** regularly
5. **Review permissions** for Azure app
6. **Backup** `/data` directory regularly

---

## 🐛 Troubleshooting

### Bridge not connecting?

```bash
# Check bridge logs
docker-compose logs bridge-outlook

# Verify registration file
docker exec -it inboxforge-aio cat /data/appservices/outlook.yaml
```

### Conduit not starting?

```bash
# Check permissions
docker exec -it inboxforge-aio ls -la /data/conduit

# Reset database (warning: deletes all data)
rm -rf data/conduit/*
docker-compose restart
```

### API errors?

```bash
# Check API logs
docker-compose logs api

# Verify environment variables
docker exec -it inboxforge-aio env | grep OPENAI
```

---

## 📝 License

MIT License - see LICENSE file for details

---

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

## 📧 Support

For issues and questions, please use GitHub Issues.

