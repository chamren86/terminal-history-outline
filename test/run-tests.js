#!/usr/bin/env node
/**
 * Simple test runner for the extension
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function findTestFiles(dir) {
    const results = [];
    if (!fs.existsSync(dir)) {
        return results;
    }
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...findTestFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('Test.js')) {
            results.push(fullPath);
        }
    }
    return results;
}

async function runTest(file) {
    return new Promise((resolve) => {
        const relativePath = path.relative(process.cwd(), file);
        console.log(`\n🧪 Running: ${relativePath}`);
        const proc = spawn('node', ['--test', file], {
            stdio: 'inherit',
            cwd: process.cwd()
        });
        proc.on('exit', (code) => {
            resolve(code === 0);
        });
    });
}

async function runTests() {
    const testDir = path.join(__dirname, '../out/test/unit');
    if (!fs.existsSync(testDir)) {
        console.log('❌ Test directory not found. Run `npm run compile` first.');
        process.exit(1);
    }
    const testFiles = findTestFiles(testDir);
    console.log(`📋 Found ${testFiles.length} test files\n`);
    if (testFiles.length === 0) {
        console.log('⚠️  No test files found.');
        process.exit(0);
    }
    let passed = 0;
    let failed = 0;
    for (const file of testFiles) {
        const success = await runTest(file);
        if (success) {
            passed++;
        } else {
            failed++;
        }
    }
    console.log(`\n${'='.repeat(50)}`);
    console.log(`📊 Results: ${passed} passed, ${failed} failed`);
    console.log(`${'='.repeat(50)}`);
    process.exit(failed > 0 ? 1 : 0);
}
runTests().catch(console.error);
