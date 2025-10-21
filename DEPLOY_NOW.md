# Deploy InboxForge AIO - Choose Your Method

## 🎯 Quick Deployment Options

Since Docker is not installed locally, here are your best options:

---

## Option 1: Railway (Recommended - Easiest) ⚡

**Setup time: 5 minutes**

### Steps:

1. **Install Railway CLI:**
```bash
npm install -g @railway/cli
# or
brew install railway
```

2. **Login and Deploy:**
```bash
cd /Users/stefanrosenlund/Desktop/message-agent

# Login to Railway
railway login

# Create new project
railway init

# Add environment variables
railway variables set MATRIX_SERVER_NAME=your-app.railway.app
railway variables set REGISTRATION_TOKEN=$(openssl rand -hex 32)
railway variables set OPENAI_API_KEY=your-openai-key
railway variables set GRAPH_CLIENT_ID=your-azure-client-id
railway variables set GRAPH_CLIENT_SECRET=your-azure-secret

# Deploy!
railway up
```

3. **Get your URL:**
```bash
railway domain
```

**Cost:** Free tier available, then $5/month

---

## Option 2: Render 🎨

**Setup time: 10 minutes**

### Steps:

1. **Push to GitHub:**
```bash
# Add remote
git remote add origin https://github.com/YOUR_USERNAME/inboxforge.git

# Push
git push -u origin main
```

2. **Deploy on Render:**
- Go to: https://render.com
- Click "New +" → "Web Service"
- Connect your GitHub repository
- Configure:
  - **Name:** inboxforge
  - **Environment:** Docker
  - **Plan:** Free (or Starter $7/month)
  - **Add Disk:** /data (persistent storage)

3. **Add Environment Variables:**
```
MATRIX_SERVER_NAME=your-app.onrender.com
REGISTRATION_TOKEN=(generate random string)
OPENAI_API_KEY=sk-...
GRAPH_CLIENT_ID=...
GRAPH_CLIENT_SECRET=...
GRAPH_REDIRECT_URI=https://your-app.onrender.com/oauth/callback
```

**Cost:** Free tier available (with sleep), Starter $7/month

---

## Option 3: Fly.io 🚀

**Setup time: 10 minutes**

### Steps:

1. **Install Fly CLI:**
```bash
brew install flyctl
# or
curl -L https://fly.io/install.sh | sh
```

2. **Login and Launch:**
```bash
cd /Users/stefanrosenlund/Desktop/message-agent

# Login
fly auth login

# Create app
fly launch --no-deploy

# Add secrets
fly secrets set \
  MATRIX_SERVER_NAME=your-app.fly.dev \
  REGISTRATION_TOKEN=$(openssl rand -hex 32) \
  OPENAI_API_KEY=your-key \
  GRAPH_CLIENT_ID=your-id \
  GRAPH_CLIENT_SECRET=your-secret

# Create volume for persistent data
fly volumes create data --size 1

# Deploy!
fly deploy
```

**Cost:** Free allowance, then pay-as-you-go

---

## Option 4: Local Development (No Docker) 💻

**If you just want to develop locally without Docker:**

### Steps:

1. **Install Conduit separately:**
```bash
brew install conduit
# or download from: https://conduit.rs/
```

2. **Start Conduit:**
```bash
# Create config
mkdir -p ~/.conduit
cat > ~/.conduit/conduit.toml << EOF
[global]
server_name = "localhost"
database_backend = "rocksdb"
database_path = "/tmp/conduit"
address = "127.0.0.1"
port = 6167
allow_registration = true
EOF

# Run Conduit
conduit
```

3. **Start all services in separate terminals:**

**Terminal 1 - API:**
```bash
cd /Users/stefanrosenlund/Desktop/message-agent/apps/api
cp ../../env.example .env
# Edit .env
npm run dev
```

**Terminal 2 - Web:**
```bash
cd /Users/stefanrosenlund/Desktop/message-agent/apps/web
npm run dev
```

**Terminal 3 - Bridge:**
```bash
cd /Users/stefanrosenlund/Desktop/message-agent/apps/bridge-outlook
cp ../../env.example .env
# Edit .env
npm start
```

**Access:** http://localhost:5173

---

## Option 5: Install Docker Desktop 🐳

**If you want to use Docker locally:**

1. **Download Docker Desktop:**
   - Go to: https://www.docker.com/products/docker-desktop/
   - Download for Mac
   - Install and start Docker Desktop

2. **Then deploy with Docker Compose:**
```bash
cd /Users/stefanrosenlund/Desktop/message-agent
cp env.example .env
# Edit .env with your credentials
docker-compose up -d
```

---

## Option 6: VPS (DigitalOcean, Linode, etc.) 🖥️

**For production deployment:**

### Steps:

1. **Create VPS:**
   - DigitalOcean: $5/month droplet
   - Linode: $5/month Nanode
   - Hetzner: €4/month CX11

2. **SSH into server:**
```bash
ssh root@your-server-ip
```

3. **Install Docker:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

4. **Clone and deploy:**
```bash
git clone https://github.com/YOUR_USERNAME/inboxforge.git
cd inboxforge
cp env.example .env
nano .env  # Edit with your credentials
docker-compose up -d
```

5. **Setup domain and SSL:**
```bash
# Install Caddy for automatic HTTPS
apt install -y caddy

# Configure Caddy
cat > /etc/caddy/Caddyfile << EOF
your-domain.com {
    reverse_proxy localhost:8080
}
EOF

systemctl restart caddy
```

---

## 🔑 Required Credentials

Before deploying, gather these:

### OpenAI API Key
- Get from: https://platform.openai.com/api-keys
- Example: `sk-proj-abc123...`

### Microsoft Azure App
- Go to: https://portal.azure.com
- Create app registration
- Add redirect URI: `https://your-domain.com/oauth/callback`
- Add permissions: Mail.Read, Mail.Send, offline_access
- Get: Client ID, Client Secret, Tenant ID

### Generate Random Token
```bash
# For REGISTRATION_TOKEN
openssl rand -hex 32
```

---

## 📊 Platform Comparison

| Platform | Cost | Ease | Speed | Best For |
|----------|------|------|-------|----------|
| Railway | Free/$5 | ⭐⭐⭐⭐⭐ | Fast | Quick deploy |
| Render | Free/$7 | ⭐⭐⭐⭐ | Medium | Simple hosting |
| Fly.io | Free tier | ⭐⭐⭐⭐ | Fast | Global edge |
| VPS | $5/mo | ⭐⭐⭐ | Fast | Full control |
| Local Dev | Free | ⭐⭐⭐⭐⭐ | Instant | Development |

---

## 🎯 My Recommendation

**For first deployment:** Use **Railway** or **Render**
- No local setup needed
- Free tier to test
- Easy to configure
- Deploy in minutes

**For production:** Use **VPS** with Docker
- More control
- Lower cost at scale
- Your own domain
- Better performance

**For development:** Use **Local Dev** (Option 4)
- No deployment needed
- Fast iteration
- Full debugging

---

## ❓ Which Should You Choose?

Ask yourself:

1. **Do you just want to test it?** → Railway/Render
2. **Do you need production-ready?** → VPS
3. **Do you want to develop/modify?** → Local Dev
4. **Do you have Docker installed?** → Docker Compose

---

## 🆘 Need Help?

I can guide you through any of these options. Just tell me which one you'd like to try!

