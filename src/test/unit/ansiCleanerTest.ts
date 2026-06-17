import * as assert from 'assert';
import { cleanTerminalOutput } from '../../cleaner.js';
import { describe, it } from 'vitest';


const SAMPLE_OUTPUTS = {
    greenText: '\u001b[32mgreen text\u001b[0m',
    redText: '\u001b[31mred text\u001b[0m',
    boldText: '\u001b[1mbold text\u001b[0m',
    vsCodeSequence: '\u001b]633;CDesktop\u001b]633;C Documents',
    vsCodeWithColors: '\u001b]633;C\u001b[0m\u001b[01;34mDesktop\u001b[0m  \u001b[01;34mDocuments\u001b[0m',
    lsOutput: '\u001b]633;C\u001b[0m\u001b[01;34mDesktop\u001b[0m  \u001b[01;34mDownloads\u001b[0m  \u001b[01;34mPictures\u001b[0m',
    mixedContent: '\u001b[32mSuccess\u001b[0m: 3 files \u001b[33mmodified\u001b[0m, 2 \u001b[31mdeleted\u001b[0m',
    gitStatus: '\u001b[32mon branch main\u001b[0m\n\u001b[33mmodified:   src/app.ts\u001b[0m',
    dockerLogs: '\u001b[36mINFO\u001b[0m: Container started\n\u001b[33mWARN\u001b[0m: Memory usage high\n\u001b[31mERROR\u001b[0m: Connection refused',
    rgbColor: '\u001b[38;2;255;100;50mRGB text\u001b[0m',
    hyperlink: '\u001b]8;;https://example.com\u001b\\link text\u001b]8;;\u001b\\',
    bracketContent: '[WARNING] This has brackets [that should] remain',
};

describe('ANSI Cleaner Tests', () => {
    it('Should remove basic ANSI color codes', () => {
        assert.strictEqual(cleanTerminalOutput(SAMPLE_OUTPUTS.greenText), 'green text');
        assert.strictEqual(cleanTerminalOutput(SAMPLE_OUTPUTS.redText), 'red text');
        assert.strictEqual(cleanTerminalOutput(SAMPLE_OUTPUTS.boldText), 'bold text');
    });

    it('Should remove VS Code shell integration sequences', () => {
        assert.strictEqual(cleanTerminalOutput(SAMPLE_OUTPUTS.vsCodeSequence), 'Desktop Documents');
        assert.strictEqual(cleanTerminalOutput(SAMPLE_OUTPUTS.vsCodeWithColors), 'Desktop Documents');
    });

    it('Should handle ls output with colors', () => {
        const result = cleanTerminalOutput(SAMPLE_OUTPUTS.lsOutput);
        assert.strictEqual(result, 'Desktop Downloads Pictures');
    });

    it('Should handle mixed content with colors', () => {
        const result = cleanTerminalOutput(SAMPLE_OUTPUTS.mixedContent);
        assert.strictEqual(result, 'Success: 3 files modified, 2 deleted');
    });

    it('Should handle git status output', () => {
        const result = cleanTerminalOutput(SAMPLE_OUTPUTS.gitStatus);
        assert.strictEqual(result, 'on branch main modified: src/app.ts');
    });

    it('Should handle docker logs with colors', () => {
        const result = cleanTerminalOutput(SAMPLE_OUTPUTS.dockerLogs);
        assert.strictEqual(result, 'INFO: Container started WARN: Memory usage high ERROR: Connection refused');
    });

    it('Should handle RGB color codes (24-bit)', () => {
        const result = cleanTerminalOutput(SAMPLE_OUTPUTS.rgbColor);
        assert.strictEqual(result, 'RGB text');
    });

    it('Should handle OSC 8 hyperlinks', () => {
        const result = cleanTerminalOutput(SAMPLE_OUTPUTS.hyperlink);
        assert.strictEqual(result, 'link text');
    });

    it('Should not strip legitimate bracket content', () => {
        const result = cleanTerminalOutput(SAMPLE_OUTPUTS.bracketContent);
        assert.strictEqual(result, '[WARNING] This has brackets [that should] remain');
    });

    it('Should handle empty string', () => {
        assert.strictEqual(cleanTerminalOutput(''), '');
    });

    it('Should handle null or undefined input', () => {
        assert.strictEqual(cleanTerminalOutput(null as any), '');
        assert.strictEqual(cleanTerminalOutput(undefined as any), '');
    });

    it('Should handle very long outputs without performance issues', () => {
        const longInput = 'a'.repeat(100000) + '\u001b[32m' + 'b'.repeat(1000) + '\u001b[0m';
        const start = Date.now();
        const result = cleanTerminalOutput(longInput);
        const end = Date.now();
        assert.ok(end - start < 100, `Took ${end - start}ms`);
        assert.ok(result.includes('b'));
    });
});
