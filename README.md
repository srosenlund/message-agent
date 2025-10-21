# InboxForge AIO

![Matrix](https://img.shields.io/badge/Matrix-Powered-blue)
![Docker](https://img.shields.io/badge/Docker-Ready-brightgreen)
![AI](https://img.shields.io/badge/AI-Enhanced-purple)

**All-in-One Matrix-powered email client with AI draft suggestions**

InboxForge is a modern, self-hosted email client that bridges Microsoft Outlook with Matrix protocol, featuring AI-powered draft generation, keyboard shortcuts, and a beautiful PWA interface.

---

## ✨ Features

- 📧 **Outlook Integration** - Bidirectional email sync via Microsoft Graph API
- 🤖 **AI Drafts** - OpenAI-powered response suggestions with SSE streaming
- ⌨️ **Keyboard Shortcuts** - Vim-style navigation (j/k/s/r/v)
- 🔐 **Matrix Protocol** - Standards-based, E2EE-ready messaging
- 📱 **PWA Support** - Install as native app on any device
- 🐳 **Single Container** - All services in one Docker image
- 🚀 **Easy Deploy** - Works on any VPS, Railway, Render, Fly.io

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│            Nginx :8080 (Reverse Proxy)          │
├─────────────┬────────────┬──────────────────────┤
│  React PWA  │  Hono API  │  Conduit (Matrix)    │
│             │  + OpenAI  │  Homeserver          │
└─────────────┴────────────┴──────────────────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
  ┌──────▼────────┐    ┌──────▼────────┐
  │  OpenAI API   │    │ Outlook Bridge│
  │               │    │  + Graph API  │
  └───────────────┘    └───────────────┘
```

### Components

1. **Conduit** - Lightweight Rust-based Matrix homeserver
2. **Outlook Bridge** - Matrix AppService for email sync
3. **API** - Hono REST API with OpenAI integration
4. **Web PWA** - React + TypeScript frontend
5. **Nginx** - Reverse proxy and static serving
6. **s6-overlay** - Process supervision

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- OpenAI API key
- Microsoft Azure app credentials

### Installation

1. **Clone repository:**
```bash
git clone https://github.com/yourusername/message-agent.git
cd message-agent
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Start services:**
```bash
docker-compose up -d
```

4. **Access web interface:**
```
http://localhost:8080
```

**Full setup instructions:** See [SETUP.md](SETUP.md)  
**Deployment guide:** See [DEPLOYMENT.md](DEPLOYMENT.md)

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `j` | Next room |
| `k` | Previous room |
| `r` | Toggle reply panel |
| `s` | Generate AI suggestion |
| `v` | Verify & lock draft |
| `Cmd+Enter` | Send message |

---

## 📁 Project Structure

```
message-agent/
├── apps/
│   ├── api/              # Hono API with OpenAI integration
│   ├── bridge-outlook/   # Matrix AppService bridge
│   └── web/              # React PWA (Vite + TypeScript)
├── config/
│   ├── conduit/          # Conduit homeserver config
│   ├── nginx/            # Nginx reverse proxy config
│   └── s6-overlay/       # Process supervisor scripts
├── data/                 # Persistent data (Docker volumes)
├── Dockerfile            # Multi-stage build
├── docker-compose.yml    # Orchestration
├── SETUP.md             # Detailed setup guide
└── DEPLOYMENT.md        # Production deployment guide
```

---

## 🔧 Development

### Local Development (without Docker)

**Terminal 1 - API:**
```bash
cd apps/api
npm install
npm run dev
```

**Terminal 2 - Bridge:**
```bash
cd apps/bridge-outlook
npm install
npm start
```

**Terminal 3 - Web:**
```bash
cd apps/web
npm install
npm run dev
```

**Terminal 4 - Conduit:**
```bash
# Install Conduit separately
conduit
```

---

## 🌐 API Endpoints

### Health Check
```
GET /api/health
```

### AI Draft Suggestion (SSE)
```
POST /api/ai/suggest
{
  "roomId": "!abc:localhost",
  "prompt": "Draft a professional response"
}
```

### Send Email
```
POST /api/send/outlook
{
  "roomId": "!abc:localhost",
  "html": "<p>Email content</p>",
  "inReplyTo": "message-id"
}
```

### Get Rooms
```
GET /api/rooms
```

### Get Messages
```
GET /api/rooms/:roomId/messages
```

---

## 🔐 Security

- ✅ All secrets in environment variables
- ✅ Rate limiting on API and Matrix endpoints
- ✅ Security headers (X-Frame-Options, CSP)
- ✅ CORS configured
- ✅ E2EE support ready
- ✅ AppService authentication

**Production:** Use HTTPS with valid certificates (Caddy/certbot)

---

## 📊 Technology Stack

**Backend:**
- [Conduit](https://conduit.rs/) - Matrix homeserver (Rust)
- [Hono](https://hono.dev/) - Fast web framework (TypeScript)
- [matrix-appservice-bridge](https://github.com/matrix-org/matrix-appservice-bridge) - Bridge SDK
- [Microsoft Graph](https://learn.microsoft.com/en-us/graph/) - Outlook API
- [OpenAI](https://platform.openai.com/) - AI completions

**Frontend:**
- [React 18](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [Matrix JS SDK](https://github.com/matrix-org/matrix-js-sdk) - Matrix client
- [Vite](https://vitejs.dev/) - Build tool

**Infrastructure:**
- [Alpine Linux](https://alpinelinux.org/) - Base image
- [Nginx](https://nginx.org/) - Reverse proxy
- [s6-overlay](https://github.com/just-containers/s6-overlay) - Process supervisor
- [Docker](https://www.docker.com/) - Containerization

---

## 📝 Environment Variables

See `.env.example` for full configuration. Key variables:

```env
# Matrix
MATRIX_SERVER_NAME=localhost
REGISTRATION_TOKEN=change-me

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview

# Microsoft Graph
GRAPH_CLIENT_ID=your-client-id
GRAPH_CLIENT_SECRET=your-secret
GRAPH_TENANT_ID=common
```

---

## 🐛 Troubleshooting

**Services not starting?**
```bash
docker-compose logs -f
```

**Bridge authentication failing?**
```bash
docker exec -it inboxforge-aio node /app/bridge-outlook/register.js
```

**OpenAI errors?**
- Check API key is valid
- Verify you have credits
- Check model name is correct

See [SETUP.md](SETUP.md) for detailed troubleshooting.

---

## 🚢 Deployment

### Supported Platforms

- ✅ Any VPS (DigitalOcean, Linode, Hetzner, etc.)
- ✅ Railway
- ✅ Render
- ✅ Fly.io
- ✅ Kubernetes
- ✅ Sliplane (optimized)

See [DEPLOYMENT.md](DEPLOYMENT.md) for platform-specific guides.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 🙏 Acknowledgments

- [Conduit](https://conduit.rs/) - Lightweight Matrix homeserver
- [Matrix.org](https://matrix.org/) - Open communication protocol
- [Hono](https://hono.dev/) - Fast web framework
- [OpenAI](https://openai.com/) - AI capabilities

---

## 📧 Support

- **Issues:** [GitHub Issues](https://github.com/yourusername/message-agent/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/message-agent/discussions)
- **Matrix:** `#inboxforge:matrix.org`

---

**Made with ❤️ for the Matrix ecosystem**

