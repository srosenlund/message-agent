# Deploy to GitHub - Complete Guide

## 🎯 Recommended: One-Command Deploy

Run this single command to deploy everything automatically:

```bash
./github-deploy-now.sh
```

This will:
1. ✅ Install GitHub CLI (via Homebrew)
2. ✅ Authenticate with GitHub
3. ✅ Create repository
4. ✅ Push all your code

---

## 📋 Manual Steps (If You Prefer)

### Step 1: Install GitHub CLI

```bash
brew install gh
```

### Step 2: Login to GitHub

```bash
gh auth login
```

Follow the prompts to authenticate.

### Step 3: Create Repository and Push

```bash
# Create repository and push in one command
gh repo create inboxforge \
  --public \
  --source=. \
  --description="InboxForge AIO - Matrix-powered email client with AI drafts" \
  --push
```

Or for a private repository:

```bash
gh repo create inboxforge \
  --private \
  --source=. \
  --description="InboxForge AIO - Matrix-powered email client with AI drafts" \
  --push
```

---

## 🔧 Traditional Git Method

### Step 1: Create Repository on GitHub

Go to https://github.com/new and create a new repository named `inboxforge`.

**IMPORTANT:** Do NOT initialize with README, .gitignore, or license.

### Step 2: Add Remote and Push

```bash
# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/inboxforge.git

# Push to GitHub
git push -u origin main
```

If you need to authenticate:

**Option A: Using SSH (Recommended)**
```bash
# Generate SSH key if you don't have one
ssh-keygen -t ed25519 -C "mail@stefanrosenlund.dk"

# Add to ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Copy public key and add to GitHub
cat ~/.ssh/id_ed25519.pub | pbcopy
# Go to: https://github.com/settings/keys
# Click "New SSH key" and paste

# Use SSH URL
git remote set-url origin git@github.com:YOUR_USERNAME/inboxforge.git
git push -u origin main
```

**Option B: Using Personal Access Token**
```bash
# Create token at: https://github.com/settings/tokens
# Select: repo (full control)
# Use token as password when pushing
git push -u origin main
# Username: YOUR_USERNAME
# Password: ghp_your_token_here
```

---

## ✅ Verify Deployment

After pushing, verify your repository:

```bash
# View in browser
gh repo view --web

# Or manually visit:
# https://github.com/YOUR_USERNAME/inboxforge
```

---

## 🚀 Next Steps After GitHub Deployment

### 1. Deploy to Railway

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### 2. Deploy to Render

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select "Docker" as environment
5. Add environment variables
6. Deploy!

### 3. Deploy to Fly.io

```bash
brew install flyctl
flyctl auth login
flyctl launch
flyctl deploy
```

---

## 📊 Repository Information

Your repository includes:

- **4 commits** with complete implementation
- **53 tracked files**
- **Full documentation** (README, SETUP, DEPLOYMENT guides)
- **All source code** (API, Bridge, Web PWA)
- **Docker configuration** (Dockerfile, docker-compose.yml)
- **Development scripts** (setup.sh, dev.sh)

---

## 🔐 Important: Secrets Management

**Never commit these files:**
- `.env` ✅ (already in .gitignore)
- `node_modules/` ✅ (already in .gitignore)
- API keys or tokens ✅ (use environment variables)

Your `.gitignore` is properly configured to exclude:
- `.env` and `.env.local`
- `node_modules/`
- `dist/` and `build/`
- Log files
- IDE files

---

## 📝 Repository Description

When creating your repository, use this description:

```
InboxForge AIO - All-in-One Matrix-powered email client with Microsoft Outlook 
integration and AI-powered draft suggestions using OpenAI. Built with React, 
TypeScript, Hono, and Conduit. Single Docker container deployment.
```

### Topics/Tags to Add:

- `matrix`
- `email-client`
- `outlook`
- `openai`
- `ai`
- `react`
- `typescript`
- `docker`
- `pwa`
- `matrix-appservice`

---

## 🐛 Troubleshooting

### Error: "remote: Repository not found"

**Solution:** Make sure you created the repository on GitHub first.

```bash
# Create it with GitHub CLI
gh repo create inboxforge --public
```

### Error: "Authentication failed"

**Solution:** Set up authentication properly.

```bash
# Use GitHub CLI for easiest auth
gh auth login

# Or set up SSH key
ssh-keygen -t ed25519 -C "mail@stefanrosenlund.dk"
```

### Error: "rejected: Updates were rejected"

**Solution:** You might have initialized the repo with files.

```bash
# Force push (only if you're sure)
git push -u origin main --force
```

### Error: "Permission denied (publickey)"

**Solution:** Add your SSH key to GitHub.

```bash
# Copy your public key
cat ~/.ssh/id_ed25519.pub | pbcopy

# Add at: https://github.com/settings/keys
```

---

## 🎉 Success!

Once pushed to GitHub, your repository will be:

✅ Version controlled  
✅ Backed up in the cloud  
✅ Ready to deploy to any platform  
✅ Shareable with collaborators  
✅ Connected to CI/CD pipelines  

---

## 📖 See Also

- **DEPLOYMENT.md** - Platform-specific deployment guides
- **SETUP.md** - Local setup instructions
- **QUICKSTART.md** - 5-minute quick start
- **README.md** - Project overview

---

**Ready to deploy? Run: `./github-deploy-now.sh`** 🚀

