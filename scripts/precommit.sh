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

# 3. GitHub Actions simulation (if act is available and Docker is running)
if command -v act &> /dev/null; then
    # Check if Docker is running (use sudo)
    if sudo systemctl is-active --quiet docker; then
        echo ""
        echo "🐳 Running GitHub Actions with act..."
        # Run act with docker group permissions
        sg docker -c "act -j test --pull=false"
    else
        echo ""
        echo "⚠️  Docker is not running. Skipping GitHub Actions simulation."
        echo "   To run act, start Docker: sudo systemctl start docker"
    fi
else
    echo ""
    echo "ℹ️  'act' not installed. Skipping GitHub Actions simulation."
    echo "   To install act:"
    echo "   - Ubuntu/Debian: curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash"
    echo "   - macOS: brew install act"
    echo "   - Windows: choco install act"
    echo "   Or visit: https://github.com/nektos/act"
fi

echo ""
echo "========================================"
echo "✅ All checks passed! Ready to commit."
echo ""
echo "To commit, run: git commit"
echo "========================================"
