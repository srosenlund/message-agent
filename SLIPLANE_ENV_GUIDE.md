# Sliplane Environment Variables Guide

## 🔑 Required Environment Variables for Sliplane

### Priority 1: Essential (App Won't Start Without These)

#### 1. **MATRIX_SERVER_NAME**
```
MATRIX_SERVER_NAME=your-app.sliplane.app
```
- **What:** Your Matrix server domain
- **Value:** Use your Sliplane app domain (e.g., `inboxforge.sliplane.app`)
- **Required:** Yes

#### 2. **REGISTRATION_TOKEN**
```
REGISTRATION_TOKEN=generate-a-random-secure-token
```
- **What:** Secret token for Matrix user registration
- **Value:** Generate with: `openssl rand -hex 32`
- **Required:** Yes
- **Security:** Keep this secret! Anyone with this can register users

---

### Priority 2: AI Features (Required for Draft Suggestions)

#### 3. **OPENAI_API_KEY**
```
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
```
- **What:** OpenAI API key for AI draft suggestions
- **Get from:** https://platform.openai.com/api-keys
- **Required:** For AI features (can skip initially)
- **Cost:** Pay-as-you-go (~$0.002 per draft)

#### 4. **OPENAI_MODEL** (Optional)
```
OPENAI_MODEL=gpt-4-turbo-preview
```
- **What:** Which OpenAI model to use
- **Default:** gpt-4-turbo-preview
- **Options:** 
  - `gpt-4-turbo-preview` (Best quality, slower, $$$)
  - `gpt-3.5-turbo` (Faster, cheaper)
- **Required:** No (has default)

---

### Priority 3: Outlook Integration (Required for Email Sync)

#### 5. **GRAPH_CLIENT_ID**
```
GRAPH_CLIENT_ID=12345678-1234-1234-1234-123456789abc
```
- **What:** Azure App Registration Client ID
- **Get from:** https://portal.azure.com → App registrations
- **Required:** For Outlook integration
- **Setup:** See below

#### 6. **GRAPH_CLIENT_SECRET**
```
GRAPH_CLIENT_SECRET=abc~123.xyz_456-789
```
- **What:** Azure App Registration Client Secret
- **Get from:** Azure Portal → Your App → Certificates & secrets
- **Required:** For Outlook integration
- **Security:** Keep this secret!

#### 7. **GRAPH_TENANT_ID** (Optional)
```
GRAPH_TENANT_ID=common
```
- **What:** Azure Active Directory Tenant ID
- **Default:** `common` (works for most personal accounts)
- **Options:**
  - `common` - Any Microsoft account
  - `organizations` - Only work/school accounts
  - `consumers` - Only personal accounts
  - Your specific tenant ID (UUID)
- **Required:** No (defaults to `common`)

#### 8. **GRAPH_REDIRECT_URI**
```
GRAPH_REDIRECT_URI=https://your-app.sliplane.app/oauth/callback
```
- **What:** OAuth callback URL for Microsoft authentication
- **Value:** `https://YOUR_DOMAIN/oauth/callback`
- **Required:** Yes (for Outlook)
- **Important:** Must match EXACTLY what you configure in Azure Portal

---

### Priority 4: Generated Tokens (Set After First Deploy)

#### 9. **MATRIX_BOT_TOKEN**
```
MATRIX_BOT_TOKEN=syt_xxx...
```
- **What:** Access token for Matrix bot user
- **Get from:** Create bot user after deployment (see below)
- **Required:** For API to send messages
- **When:** Set this AFTER first deployment

#### 10. **AS_TOKEN_OUTLOOK**
```
AS_TOKEN_OUTLOOK=randomly-generated-hex-string
```
- **What:** AppService token for Outlook bridge
- **Get from:** Run `node apps/bridge-outlook/register.js` after deployment
- **Required:** For bridge functionality
- **When:** Set this AFTER first deployment

#### 11. **HS_TOKEN_OUTLOOK**
```
HS_TOKEN_OUTLOOK=randomly-generated-hex-string
```
- **What:** Homeserver token for Outlook bridge
- **Get from:** Same as AS_TOKEN_OUTLOOK (from register.js)
- **Required:** For bridge functionality
- **When:** Set this AFTER first deployment

---

## 🎯 Quick Start: Minimum Configuration

For initial deployment, you ONLY need these 2:

```env
MATRIX_SERVER_NAME=your-app.sliplane.app
REGISTRATION_TOKEN=openssl-rand-hex-32-output
```

This will get the app running. You can add the others later!

---

## 📋 Step-by-Step Setup

### Step 1: Configure Sliplane (Now)

Set these in Sliplane dashboard:

```env
# Essential
MATRIX_SERVER_NAME=your-app.sliplane.app
REGISTRATION_TOKEN=<generate with: openssl rand -hex 32>

# Optional: Add if you have them
OPENAI_API_KEY=sk-proj-xxx
GRAPH_CLIENT_ID=xxx
GRAPH_CLIENT_SECRET=xxx
GRAPH_REDIRECT_URI=https://your-app.sliplane.app/oauth/callback
```

### Step 2: Deploy & Create Bot User

After first deployment:

```bash
# SSH into Sliplane container or use their console
# Register a bot user
curl -X POST http://localhost:6167/_matrix/client/r0/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "bot",
    "password": "secure-bot-password",
    "admin": false,
    "type": "m.login.password"
  }'

# Copy the access_token from response
# Add to Sliplane:
# MATRIX_BOT_TOKEN=syt_xxx...
```

### Step 3: Generate Bridge Tokens

```bash
# In container or via Sliplane console
cd /app/bridge-outlook
node register.js

# Copy AS_TOKEN_OUTLOOK and HS_TOKEN_OUTLOOK from output
# Add both to Sliplane environment variables
```

### Step 4: Restart

After adding tokens, restart the service in Sliplane dashboard.

---

## 🔐 How to Get Azure Credentials

### Create Azure App Registration:

1. **Go to:** https://portal.azure.com
2. **Navigate to:** Azure Active Directory → App registrations
3. **Click:** New registration

### Configure App:

**Name:** InboxForge  
**Supported account types:** Accounts in any organizational directory and personal Microsoft accounts  
**Redirect URI:**
- Platform: Web
- URI: `https://your-app.sliplane.app/oauth/callback`

### Add Permissions:

Go to: API permissions → Add a permission → Microsoft Graph → Delegated

Add:
- ✅ `Mail.Read`
- ✅ `Mail.Send`
- ✅ `offline_access`

Click "Grant admin consent"

### Get Client Secret:

Go to: Certificates & secrets → New client secret
- Description: "InboxForge production"
- Expires: 24 months (or Never)
- **Copy the VALUE** (you can't see it again!)

### Get IDs:

- **Client ID:** On "Overview" page
- **Tenant ID:** On "Overview" page (optional, use 'common' instead)

---

## 🚨 Security Best Practices

### ✅ DO:
- Use strong random tokens (32+ characters)
- Keep secrets in Sliplane's encrypted environment variables
- Rotate secrets every 6-12 months
- Use HTTPS for all redirect URIs

### ❌ DON'T:
- Commit secrets to git
- Share tokens publicly
- Use weak passwords
- Reuse tokens across environments

---

## 📊 Environment Variable Priority

### Must Have Now (Before Deploy):
1. ✅ MATRIX_SERVER_NAME
2. ✅ REGISTRATION_TOKEN

### Add Later (After Deploy):
3. MATRIX_BOT_TOKEN
4. AS_TOKEN_OUTLOOK
5. HS_TOKEN_OUTLOOK

### Add When Ready:
6. OPENAI_API_KEY (for AI)
7. GRAPH_CLIENT_ID (for Outlook)
8. GRAPH_CLIENT_SECRET (for Outlook)
9. GRAPH_REDIRECT_URI (for Outlook)

---

## 🧪 Testing Configuration

After setting variables, test:

```bash
# Check health
curl https://your-app.sliplane.app/api/health

# Expected response:
{
  "status": "healthy",
  "services": {
    "openai": true/false,
    "matrix": true/false,
    "bridge": true
  }
}
```

---

## 🆘 Troubleshooting

### App won't start?
- Check MATRIX_SERVER_NAME is set
- Check REGISTRATION_TOKEN is set
- View Sliplane logs

### AI not working?
- Verify OPENAI_API_KEY is valid
- Check you have credits: https://platform.openai.com/usage
- Test with: `curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models`

### Outlook not connecting?
- Verify GRAPH_CLIENT_ID and GRAPH_CLIENT_SECRET
- Check redirect URI matches EXACTLY in Azure Portal
- Ensure permissions are granted in Azure

### Bridge not working?
- Ensure AS_TOKEN_OUTLOOK and HS_TOKEN_OUTLOOK are set
- Check MATRIX_BOT_TOKEN is set
- Verify bridge registration: `cat /data/appservices/outlook.yaml`

---

## 📖 Quick Reference

```env
# MINIMUM (start here)
MATRIX_SERVER_NAME=app.sliplane.app
REGISTRATION_TOKEN=<openssl rand -hex 32>

# AI FEATURES
OPENAI_API_KEY=sk-proj-xxx
OPENAI_MODEL=gpt-4-turbo-preview

# OUTLOOK INTEGRATION
GRAPH_CLIENT_ID=xxx-xxx-xxx
GRAPH_CLIENT_SECRET=xxx~xxx
GRAPH_TENANT_ID=common
GRAPH_REDIRECT_URI=https://app.sliplane.app/oauth/callback

# GENERATED LATER
MATRIX_BOT_TOKEN=syt_xxx
AS_TOKEN_OUTLOOK=xxx
HS_TOKEN_OUTLOOK=xxx
```

---

**Ready to configure? Start with just MATRIX_SERVER_NAME and REGISTRATION_TOKEN!**

