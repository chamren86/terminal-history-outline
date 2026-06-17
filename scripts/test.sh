#!/bin/bash
# scripts/test.sh
# Full test suite

set -e

echo "========================================"
echo "🧪 RUNNING FULL TEST SUITE"
echo "========================================"

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔨 Compiling..."
npm run compile

echo ""
echo "🧪 Running all tests..."
vitest run

echo ""
echo "========================================"
echo "✅ All tests passed!"
echo "========================================"