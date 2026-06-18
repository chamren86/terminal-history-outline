#!/bin/bash
# scripts/quick-test.sh
# Quick test script: compile, test, and precommit

set -e

echo "========================================"
echo "🚀 QUICK TEST - Compile + Test + Precommit"
echo "========================================"

# Track timing
START_TIME=$(date +%s)

# 1. Compile
echo ""
echo "🔨 Compiling..."
npm run compile
if [ $? -eq 0 ]; then
    echo "✅ Compile successful"
else
    echo "❌ Compile failed"
    exit 1
fi

# 2. Run tests
echo ""
echo "🧪 Running tests..."
npm test
if [ $? -eq 0 ]; then
    echo "✅ Tests passed"
else
    echo "❌ Tests failed"
    exit 1
fi

# 3. Run precommit (includes unit tests + full test suite + act if available)
echo ""
echo "🔬 Running precommit checks..."
npm run precommit
if [ $? -eq 0 ]; then
    echo "✅ Precommit checks passed"
else
    echo "❌ Precommit checks failed"
    exit 1
fi

# Calculate total time
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "========================================"
echo "✅ All checks passed! (${DURATION}s)"
echo "========================================"