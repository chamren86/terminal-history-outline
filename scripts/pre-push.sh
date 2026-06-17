#!/bin/bash
# scripts/prepush.sh
# Pre-push validation

set -e

echo "========================================"
echo "🔍 RUNNING PRE-PUSH VALIDATION"
echo "========================================"

# Check for uncommitted changes
if ! git diff --quiet; then
    echo "❌ Uncommitted changes detected. Commit or stash them first."
    exit 1
fi

# 1. Clean install
echo ""
echo "📦 Installing dependencies..."
npm install

# 2. Type checking (if available)
if command -v npx tsc &> /dev/null; then
    echo ""
    echo "🔍 Running TypeScript type check..."
    npx tsc --noEmit --strict
fi

# 3. Compile
echo ""
echo "🔨 Compiling..."
npm run compile

# 4. Run tests
echo ""
echo "🧪 Running tests..."
npm test

echo ""
echo "========================================"
echo "✅ All checks passed! Ready to push."
echo "========================================"