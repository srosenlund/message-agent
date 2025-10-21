#!/bin/bash

echo "🚀 InboxForge Deployment Helper"
echo "================================"
echo ""
echo "Choose your deployment method:"
echo ""
echo "1) Railway (Recommended - Easiest)"
echo "2) Render"
echo "3) Fly.io"
echo "4) Local Development (No Docker)"
echo "5) Install Docker Desktop"
echo "6) VPS Deployment"
echo ""
read -p "Enter choice [1-6]: " choice

case $choice in
  1)
    echo ""
    echo "📦 Setting up Railway deployment..."
    echo ""
    
    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        echo "Installing Railway CLI..."
        npm install -g @railway/cli
    fi
    
    echo "Logging into Railway..."
    railway login
    
    echo "Creating new project..."
    railway init
    
    echo ""
    echo "⚠️  IMPORTANT: Set these environment variables in Railway dashboard:"
    echo ""
    echo "MATRIX_SERVER_NAME=your-app.railway.app"
    echo "REGISTRATION_TOKEN=$(openssl rand -hex 32)"
    echo "OPENAI_API_KEY=your-openai-key"
    echo "GRAPH_CLIENT_ID=your-azure-client-id"
    echo "GRAPH_CLIENT_SECRET=your-azure-secret"
    echo ""
    read -p "Press Enter after adding variables in Railway dashboard..."
    
    echo "Deploying..."
    railway up
    
    echo ""
    echo "✅ Deployment complete!"
    echo "Get your URL with: railway domain"
    ;;
    
  2)
    echo ""
    echo "🎨 Setting up Render deployment..."
    echo ""
    echo "1. Push your code to GitHub:"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/inboxforge.git"
    echo "   git push -u origin main"
    echo ""
    echo "2. Go to: https://render.com"
    echo "3. Create new Web Service from your GitHub repo"
    echo "4. Select 'Docker' as environment"
    echo "5. Add environment variables from env.example"
    echo "6. Add disk for /data"
    echo ""
    echo "📖 See DEPLOYMENT.md for detailed instructions"
    ;;
    
  3)
    echo ""
    echo "🚀 Setting up Fly.io deployment..."
    echo ""
    
    # Check if flyctl is installed
    if ! command -v flyctl &> /dev/null; then
        echo "Installing Fly CLI..."
        brew install flyctl || curl -L https://fly.io/install.sh | sh
    fi
    
    echo "Logging into Fly.io..."
    flyctl auth login
    
    echo "Creating app..."
    flyctl launch --no-deploy
    
    echo ""
    echo "Setting secrets..."
    read -p "Enter your OpenAI API key: " openai_key
    read -p "Enter your Azure Client ID: " azure_id
    read -p "Enter your Azure Client Secret: " azure_secret
    
    flyctl secrets set \
      MATRIX_SERVER_NAME=$(flyctl info -j | jq -r '.Hostname') \
      REGISTRATION_TOKEN=$(openssl rand -hex 32) \
      OPENAI_API_KEY=$openai_key \
      GRAPH_CLIENT_ID=$azure_id \
      GRAPH_CLIENT_SECRET=$azure_secret
    
    echo "Creating volume..."
    flyctl volumes create data --size 1
    
    echo "Deploying..."
    flyctl deploy
    
    echo ""
    echo "✅ Deployment complete!"
    flyctl open
    ;;
    
  4)
    echo ""
    echo "💻 Setting up local development..."
    echo ""
    
    # Check if Conduit is installed
    if ! command -v conduit &> /dev/null; then
        echo "⚠️  Conduit not found. Install with:"
        echo "  brew install conduit"
        echo "  or download from https://conduit.rs/"
        echo ""
        read -p "Press Enter to continue..."
    fi
    
    echo "Starting services..."
    echo ""
    echo "Open these in separate terminal windows:"
    echo ""
    echo "Terminal 1 - Conduit:"
    echo "  conduit"
    echo ""
    echo "Terminal 2 - API:"
    echo "  cd apps/api && npm run dev"
    echo ""
    echo "Terminal 3 - Web:"
    echo "  cd apps/web && npm run dev"
    echo ""
    echo "Terminal 4 - Bridge:"
    echo "  cd apps/bridge-outlook && npm start"
    echo ""
    echo "Or use tmux: ./scripts/dev.sh"
    ;;
    
  5)
    echo ""
    echo "🐳 Installing Docker Desktop..."
    echo ""
    echo "Opening Docker Desktop download page..."
    open "https://www.docker.com/products/docker-desktop/"
    echo ""
    echo "After installation:"
    echo "1. Start Docker Desktop"
    echo "2. Run: cp env.example .env"
    echo "3. Edit .env with your credentials"
    echo "4. Run: docker-compose up -d"
    ;;
    
  6)
    echo ""
    echo "🖥️  VPS Deployment Instructions"
    echo ""
    echo "1. Create a VPS (DigitalOcean, Linode, Hetzner)"
    echo "2. SSH into server: ssh root@your-server-ip"
    echo "3. Install Docker: curl -fsSL https://get.docker.com | sh"
    echo "4. Clone repo: git clone https://github.com/YOUR_USERNAME/inboxforge.git"
    echo "5. Configure: cd inboxforge && cp env.example .env && nano .env"
    echo "6. Deploy: docker-compose up -d"
    echo ""
    echo "📖 See DEPLOYMENT.md for detailed instructions"
    ;;
    
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac

echo ""
echo "📖 For more details, see:"
echo "  - DEPLOY_NOW.md (all options)"
echo "  - DEPLOYMENT.md (detailed guides)"
echo "  - QUICKSTART.md (quick setup)"
