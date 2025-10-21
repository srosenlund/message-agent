#!/bin/bash
set -e

echo "🚀 InboxForge AIO - Setup Script"
echo "=================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your credentials before proceeding"
    exit 0
fi

echo "📦 Installing dependencies..."
echo ""

# API
echo "Installing API dependencies..."
cd apps/api && npm install && cd ../..

# Bridge
echo "Installing Bridge dependencies..."
cd apps/bridge-outlook && npm install && cd ../..

# Web
echo "Installing Web dependencies..."
cd apps/web && npm install && cd ../..

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your API keys and credentials"
echo "2. Run: docker-compose up -d"
echo "3. Open: http://localhost:8080"
echo ""
echo "For detailed instructions, see SETUP.md"

