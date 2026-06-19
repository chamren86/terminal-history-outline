// test/loader.js - Node.js module loader for tests
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const mockPath = resolve(__dirname, '../out/test/mocks/vscode.js');

export async function resolve(specifier, context, next) {
    // Intercept 'vscode' imports and redirect to the mock
    if (specifier === 'vscode') {
        return {
            url: 'file://' + mockPath,
            format: 'module',
            shortCircuit: true
        };
    }
    return next(specifier, context);
}
