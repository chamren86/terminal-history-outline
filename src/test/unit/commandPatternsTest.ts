/**
 * @file commandPatternsTest.ts
 * @description Unit tests for command pattern detection
 */

import { describe, it, expect } from 'vitest';
import { ERROR_DETECTION_PATTERNS } from '../../constants/index.js';

describe('Command Patterns', () => {
    describe('Error Detection', () => {
        it('should detect git command errors', () => {
            const errorPatterns = ERROR_DETECTION_PATTERNS;
            expect(errorPatterns.some(p => /fatal/.test(p) || /error/.test(p))).toBe(true);
        });

        it('should detect command not found errors', () => {
            const errorPatterns = ERROR_DETECTION_PATTERNS;
            expect(errorPatterns.some(p => /not found/.test(p))).toBe(true);
        });

        it('should detect permission denied errors', () => {
            const errorPatterns = ERROR_DETECTION_PATTERNS;
            expect(errorPatterns.some(p => /permission denied/.test(p))).toBe(true);
        });
    });

    describe('Pattern Coverage', () => {
        it('should have error patterns defined', () => {
            expect(ERROR_DETECTION_PATTERNS.length).toBeGreaterThan(0);
        });

        it('should include git-specific errors', () => {
            expect(ERROR_DETECTION_PATTERNS.some(p => /fatal/.test(p))).toBe(true);
        });
    });
});