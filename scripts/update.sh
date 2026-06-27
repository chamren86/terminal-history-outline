#!/bin/bash
# scripts/update.sh
# Build and install the extension locally

set -e

echo "========================================"
echo "🔧 Building and installing extension"
echo "========================================"

# 1. Clean and build
echo "🧹 Cleaning..."
rm -rf out *.vsix

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building..."
npm run compile

echo "📦 Packaging..."
npx vsce package

# 2. Find the generated VSIX file (dynamically)
VSIX_FILE=$(ls -t *.vsix 2>/dev/null | head -n 1)

if [ -z "$VSIX_FILE" ]; then
    echo "❌ No VSIX file found!"
    exit 1
fi

echo "📦 Installing: $VSIX_FILE"

# 3. Install the extension
if code --install-extension "$VSIX_FILE" --force; then
    echo ""
    echo "✅ Extension installed successfully!"
    echo "📦 VSIX: $VSIX_FILE"
    echo "🔄 Please reload VS Code (Ctrl+Shift+P → Developer: Reload Window)"
else
    echo "❌ Failed to install extension!"
    exit 1
fi