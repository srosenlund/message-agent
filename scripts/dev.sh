#!/bin/bash

echo "🔧 Starting InboxForge in development mode..."
echo ""
echo "This will start all services in separate terminals:"
echo "- API (http://localhost:3000)"
echo "- Web (http://localhost:5173)"
echo "- Bridge (http://localhost:9000)"
echo ""
echo "Note: You need to run Conduit separately"
echo ""

# Check if tmux is available
if command -v tmux &> /dev/null; then
    echo "Starting with tmux..."
    tmux new-session -d -s inboxforge
    tmux split-window -h
    tmux split-window -v
    
    tmux send-keys -t inboxforge:0.0 'cd apps/api && npm run dev' C-m
    tmux send-keys -t inboxforge:0.1 'cd apps/web && npm run dev' C-m
    tmux send-keys -t inboxforge:0.2 'cd apps/bridge-outlook && npm start' C-m
    
    tmux attach-session -t inboxforge
else
    echo "⚠️  tmux not found. Starting services individually..."
    echo "Terminal 1 - API:"
    echo "  cd apps/api && npm run dev"
    echo ""
    echo "Terminal 2 - Web:"
    echo "  cd apps/web && npm run dev"
    echo ""
    echo "Terminal 3 - Bridge:"
    echo "  cd apps/bridge-outlook && npm start"
fi

