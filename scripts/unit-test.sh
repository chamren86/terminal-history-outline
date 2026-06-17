#!/bin/bash
# scripts/unit-test.sh
# Quick unit tests (fast)

set -e

echo "========================================"
echo "⚡ RUNNING UNIT TESTS (Fast)"
echo "========================================"

echo ""
echo "🔨 Compiling..."
npm run compile

echo ""
echo "🧪 Running unit tests..."
vitest run

echo ""
echo "✅ Unit tests passed!"
echo "========================================"