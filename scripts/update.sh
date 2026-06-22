#!/bin/bash

echo "========================================"
echo "🔧 Updating extension"
echo "========================================"

# Clean and build
echo "🔨 Building..."
npm run compile

# Remove test files from out directory
echo "🧹 Removing test files from out directory..."
rm -rf out/test
find out -name "*.test.js" -type f -delete 2>/dev/null || true
find out -name "*.map" -type f -delete 2>/dev/null || true

# Remove old VSIX files
echo "🧹 Removing old VSIX files..."
rm -f *.vsix 2>/dev/null || true

# Package with skip security check
echo "📦 Packaging..."
vsce package --allow-missing-repository

# Install
echo "📦 Installing..."
code --install-extension terminal-history-outline-0.5.0.vsix --force

echo ""
echo "✅ Update complete!"
echo "🔄 Please reload VS Code (Ctrl+Shift+P → Developer: Reload Window)"