#!/bin/bash
# scripts/precommit.sh
# Test GitHub Actions locally with uncommitted changes

set -e

echo "========================================"
echo "🔬 TESTING UNCOMMITTED CHANGES"
echo "========================================"

# Show what's changed
echo ""
echo "📋 Changed files:"
git status --porcelain

# 1. Quick unit tests first
echo ""
echo "⚡ Running quick unit tests..."
npm run test:unit

# 2. Full test suite
echo ""
echo "🔬 Running full test suite..."
npm run test:full

# 3. Check for GitHub Actions simulation
echo ""
echo "========================================"
echo "🐳 CHECKING GITHUB ACTIONS SIMULATION"
echo "========================================"

# Check if act is installed
ACT_PATH=""
if command -v act &> /dev/null; then
    ACT_PATH="act"
elif [ -f "./bin/act" ]; then
    ACT_PATH="./bin/act"
elif [ -f "$HOME/bin/act" ]; then
    ACT_PATH="$HOME/bin/act"
elif [ -f "/usr/local/bin/act" ]; then
    ACT_PATH="/usr/local/bin/act"
fi

if [ -n "$ACT_PATH" ]; then
    echo "✅ 'act' found at: $ACT_PATH"
    
    # Check if Docker is running
    if docker info > /dev/null 2>&1; then
        echo "✅ Docker is running"
        echo ""
        echo "🐳 Running GitHub Actions with act..."
        
        # List available jobs for debugging
        echo "📋 Available jobs:"
        $ACT_PATH -l
        
        echo ""
        echo "🚀 Running build job with push event..."
        
        # Run with explicit event and the correct job name (build)
        if $ACT_PATH push \
                     -j build \
                     --pull=false \
                     --container-architecture=linux/amd64 \
                     -P ubuntu-latest=catthehacker/ubuntu:act-latest; then
            echo "✅ GitHub Actions simulation passed!"
        else
            echo "❌ GitHub Actions simulation failed!"
            exit 1
        fi
    else
        echo "❌ Docker is not running or not installed"
        echo ""
        echo "   To install Docker:"
        echo "   sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin"
        echo ""
        echo "   To start Docker:"
        echo "   sudo systemctl start docker"
        echo "   sudo systemctl enable docker"
        echo ""
        echo "⚠️  Skipping GitHub Actions simulation"
    fi
else
    echo "❌ 'act' not installed"
    echo ""
    echo "📦 To install act:"
    echo "   Option 1 (system-wide):"
    echo "     curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash"
    echo "   Option 2 (local):"
    echo "     curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | bash"
    echo "     export PATH=\"\$PATH:\$(pwd)/bin\""
    echo "   Or visit: https://github.com/nektos/act"
    echo ""
    echo "⚠️  Skipping GitHub Actions simulation"
fi

echo ""
echo "========================================"
echo "✅ All checks passed! Ready to commit."
echo ""
echo "To commit, run: git commit"
echo "========================================"