#!/bin/bash
# scripts/update.sh
# Build, package, and install the extension locally

set -e

echo "========================================"
echo "🔧 Updating extension"
echo "========================================"

# 1. Clean and compile
echo ""
echo "🔨 Building..."
npm run compile

# 2. Remove old VSIX files
echo ""
echo "🧹 Removing old VSIX files..."
rm -f terminal-history-outline-*.vsix

# 3. Package
echo ""
echo "📦 Packaging..."
vsce package

# 4. Get the VSIX filename
VSIX_FILE=$(ls terminal-history-outline-*.vsix | head -1)
echo ""
echo "📄 VSIX file: $VSIX_FILE"

# 5. Uninstall old version (ignore if not installed)
echo ""
echo "🗑️  Uninstalling old version..."
code --uninstall-extension chamren86.terminal-history-outline || echo "Extension not installed, continuing..."

# 6. Install new version
echo ""
echo "📥 Installing new version..."
code --install-extension "$VSIX_FILE" --force

# 7. Done
echo ""
echo "========================================"
echo "✅ Extension updated successfully!"
echo "📦 Version: $(cat package.json | grep '"version"' | head -1 | sed 's/.*: "\(.*\)",/\1/')"
echo "========================================"
echo ""
echo "🔄 Reload VS Code to see changes:"
echo "   Ctrl+Shift+P → Developer: Reload Window"
