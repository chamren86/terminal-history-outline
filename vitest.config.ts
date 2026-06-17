import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['src/test/unit/**/*Test.ts'],
        globals: true,
        environment: 'node',
        testTimeout: 10000,
    },
});
