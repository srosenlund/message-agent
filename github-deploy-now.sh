#!/bin/bash

echo "🚀 InboxForge → GitHub Deployment"
echo "===================================="
echo ""

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "📦 Installing GitHub CLI..."
    echo ""
    if command -v brew &> /dev/null; then
        brew install gh
    else
        echo "❌ Homebrew not found. Install manually:"
        echo "   https://cli.github.com/"
        exit 1
    fi
fi

echo "✅ GitHub CLI installed"
echo ""

# Login to GitHub
echo "🔐 Logging into GitHub..."
gh auth login

echo ""
echo "📝 Creating GitHub repository..."
echo ""

# Create repository
read -p "Repository name [inboxforge]: " repo_name
repo_name=${repo_name:-inboxforge}

read -p "Public or Private? [public/private]: " visibility
visibility=${visibility:-public}

gh repo create "$repo_name" \
    --$visibility \
    --source=. \
    --description="InboxForge AIO - All-in-One Matrix-powered email client with AI drafts" \
    --push

echo ""
echo "✅ Repository created and pushed!"
echo ""

# Get the repository URL
repo_url=$(gh repo view --json url -q .url)

echo "🎉 Your code is now on GitHub!"
echo ""
echo "Repository: $repo_url"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Deploy to Railway:"
echo "   railway login"
echo "   railway init --repo $repo_url"
echo "   railway up"
echo ""
echo "2. Deploy to Render:"
echo "   https://render.com (connect your GitHub repo)"
echo ""
echo "3. View your repository:"
gh repo view --web

