# InboxForge AIO - Quick Start

Get up and running in 5 minutes!

## Prerequisites

- Docker & Docker Compose installed
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))
- Azure app credentials ([setup guide](https://portal.azure.com))

## 🚀 Fast Setup

### 1. Configure Environment

```bash
# Copy environment template
cp env.example .env

# Edit with your credentials
nano .env
```

**Minimal required configuration:**
```env
MATRIX_SERVER_NAME=localhost
REGISTRATION_TOKEN=your-random-secret-token
OPENAI_API_KEY=sk-your-openai-key
GRAPH_CLIENT_ID=your-azure-client-id
GRAPH_CLIENT_SECRET=your-azure-client-secret
```

### 2. Start Services

```bash
# Build and start
docker-compose up -d

# Watch logs
docker-compose logs -f
```

### 3. Register Matrix User

```bash
# Create admin user
docker exec -it inboxforge-aio sh -c '
curl -X POST http://localhost:6167/_matrix/client/r0/register \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"admin\",
    \"password\": \"your-secure-password\",
    \"admin\": true,
    \"type\": \"m.login.password\"
  }"
'
```

### 4. Setup Bridge

```bash
# Generate bridge registration
docker exec -it inboxforge-aio node /app/bridge-outlook/register.js

# Copy the tokens to your .env file
# Then restart:
docker-compose restart
```

### 5. Authenticate Outlook

1. Open: http://localhost:9000/auth/start
2. Sign in with Microsoft account
3. Grant permissions

### 6. Access Web Interface

Open: http://localhost:8080

Login with your Matrix credentials:
- Homeserver: `http://localhost:8080`
- Username: `@admin:localhost`
- Password: (what you set in step 3)

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `j` / `k` | Navigate rooms |
| `r` | Reply |
| `s` | AI suggestion |
| `v` | Verify & lock |
| `Cmd+Enter` | Send |

## 🎯 What's Next?

- **Production deployment**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Detailed setup**: See [SETUP.md](SETUP.md)
- **Troubleshooting**: Check logs with `docker-compose logs`

## 📊 Health Checks

```bash
# Overall health
curl http://localhost:8080/health

# API health
curl http://localhost:8080/api/health

# Check running services
docker-compose ps
```

## 🐛 Common Issues

**Services won't start?**
```bash
docker-compose down
docker-compose up -d
docker-compose logs -f
```

**Can't authenticate with Outlook?**
- Verify Azure app permissions include Mail.Read, Mail.Send
- Check redirect URI matches your .env setting

**AI suggestions not working?**
- Verify OpenAI API key is correct
- Check you have credits: https://platform.openai.com/usage

## 🆘 Need Help?

- Full documentation: [SETUP.md](SETUP.md)
- Deployment guide: [DEPLOYMENT.md](DEPLOYMENT.md)
- Open an issue: GitHub Issues

---

**You're all set! Happy emailing! 📧**

