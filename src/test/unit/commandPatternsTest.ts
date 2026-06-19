import * as assert from 'node:assert';
import { describe, it } from 'node:test';
import {
    hasErrorOutput,
    hasWarningOutput,
    ERROR_DETECTION_PATTERNS,
    WARNING_DETECTION_PATTERNS
} from '../../constants/commandPatterns.js';

describe('Command Patterns Tests', () => {
    describe('Error Detection', () => {
        it('Should detect git command errors', () => {
            const output = "git: 'confit' is not a git command. See 'git --help'.";
            assert.strictEqual(hasErrorOutput(output), true);
        });

        it('Should detect fatal errors', () => {
            const output = "fatal: not a git repository";
            assert.strictEqual(hasErrorOutput(output), true);
        });

        it('Should detect command not found errors', () => {
            const output = "bash: ls: command not found";
            assert.strictEqual(hasErrorOutput(output), true);
        });

        it('Should detect permission denied errors', () => {
            const output = "permission denied: /root/file.txt";
            assert.strictEqual(hasErrorOutput(output), true);
        });

        it('Should not detect success as error', () => {
            const output = "Successfully completed";
            assert.strictEqual(hasErrorOutput(output), false);
        });
    });

    describe('Warning Detection', () => {
        it('Should detect deprecation warnings', () => {
            const output = "DeprecationWarning: The `url.parse()` behavior is not standardized";
            assert.strictEqual(hasWarningOutput(output), true);
        });

        it('Should detect npm warnings', () => {
            const output = "npm warn deprecated inflight@1.0.6: This module is not supported";
            assert.strictEqual(hasWarningOutput(output), true);
        });

        it('Should detect security warnings', () => {
            const output = "Potential security issue detected: Your extension package contains sensitive information";
            assert.strictEqual(hasWarningOutput(output), true);
        });

        it('Should not detect warnings when there are errors', () => {
            const output = "error: command not found and also a warning";
            assert.strictEqual(hasWarningOutput(output), false);
            assert.strictEqual(hasErrorOutput(output), true);
        });

        it('Should not detect success as warning', () => {
            const output = "Build complete!";
            assert.strictEqual(hasWarningOutput(output), false);
        });
    });

    describe('Pattern Coverage', () => {
        it('Should have error patterns defined', () => {
            assert.ok(ERROR_DETECTION_PATTERNS.length > 0);
        });

        it('Should have warning patterns defined', () => {
            assert.ok(WARNING_DETECTION_PATTERNS.length > 0);
        });

        it('Error patterns should include git-specific errors', () => {
            const gitErrors = ERROR_DETECTION_PATTERNS.filter((p: string) => 
                p === 'is not a git command' || 
                p === 'fatal:' || 
                p === 'usage:'
            );
            assert.ok(gitErrors.length >= 3);
        });

        it('Warning patterns should include deprecation warnings', () => {
            const warningPatterns = WARNING_DETECTION_PATTERNS.filter((p: string) => 
                p === 'deprecated' || 
                p === 'is deprecated' ||
                p === 'DeprecationWarning'
            );
            assert.ok(warningPatterns.length >= 2);
        });
    });
});
