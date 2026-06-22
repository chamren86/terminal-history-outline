import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        include: ['src/test/unit/**/*Test.ts'],
        environment: 'node',
        globals: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/**/*.ts'],
            exclude: ['src/test/**/*', 'src/**/*.d.ts']
        },
        deps: {
            interopDefault: true
        }
    },
    resolve: {
        alias: {
            'vscode': path.resolve(__dirname, 'src/test/mocks/vscode.js')
        }
    }
});