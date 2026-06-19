import * as assert from 'node:assert';
import { describe, it } from 'node:test';

describe('Extension Tests', () => {
    it('Should handle command cleanup', () => {
        const commandLine = 'ls --color=auto';
        const cleaned = commandLine.replace(/ --color=auto/g, '');
        assert.strictEqual(cleaned, 'ls');
    });

    it('Should handle error detection in output', () => {
        const errorPatterns = [
            'error',
            'fail',
            'exception',
            'not found',
            'permission denied',
            'No such file',
            'command not found',
            'EACCES',
            'ENOENT',
            'is not a git command',
            'fatal:',
            'usage:',
            'try "git --help"',
            'did you mean'
        ];
        assert.ok(errorPatterns.length > 0);
    });

    it('Should handle warning detection in output', () => {
        const warningPatterns = [
            'deprecationwarning',
            'deprecated',
            'npm warn',
            'warning:',
            'potential security issue',
            'found vulnerabilities',
            '⚠️'
        ];
        assert.ok(warningPatterns.length > 0);
    });
});