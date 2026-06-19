import * as assert from 'node:assert';
import { describe, it, before, after } from 'node:test';
import { 
    detectSensitiveData, 
    redactSensitiveData, 
    isExcludedCommand,
    setSecurityConfig,
    shouldRedactOrBlock
} from '../../security.js';
import { SENSITIVE_PATTERNS } from '../../constants/index.js';
import { RedactionAction, RedactionLevel } from '../../enums/index.js';
import { ISecurityConfig } from '../../interfaces/index.js';

const SENSITIVE_SAMPLES = {
    password: 'mysql -u root -pMySecretPassword123',
    passwordColon: 'mysql -u root -p:MySecretPassword123',
    passwordEquals: 'mysql -u root --password=MySecretPassword123',
    apiKey: 'curl -H "Authorization: Bearer sk-abc123xyz789def456" https://api.example.com',
    awsKey: 'AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE',
    jwt: 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    githubToken: 'ghp_abcdefghijklmnopqrstuvwxyz1234567890',
    slackToken: 'xoxb-1234567890-abcdefghijklmnopqrstuvwx',
    sshKey: `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
-----END RSA PRIVATE KEY-----`,
};

const testConfig: ISecurityConfig = {
    detectionEnabled: true,
    redactionLevel: RedactionLevel.REDACT,
    customPatterns: [],
    excludedCommands: ['mysql.*', '.*secret.*'],
    warnOnDetection: true
};

describe('Security Tests', () => {
    before(() => {
        setSecurityConfig(testConfig);
    });

    it('Should detect passwords in commands', () => {
        const result = detectSensitiveData(SENSITIVE_SAMPLES.password);
        const hasPasswordPattern = result.some(p => p.name === 'password');
        assert.strictEqual(hasPasswordPattern, true);
    });

    it('Should detect passwords with colon format', () => {
        const result = detectSensitiveData(SENSITIVE_SAMPLES.passwordColon);
        const hasPasswordPattern = result.some(p => p.name === 'password');
        assert.strictEqual(hasPasswordPattern, true);
    });

    it('Should detect passwords with equals format', () => {
        const result = detectSensitiveData(SENSITIVE_SAMPLES.passwordEquals);
        const hasPasswordPattern = result.some(p => p.name === 'password');
        assert.strictEqual(hasPasswordPattern, true);
    });

    it('Should detect API keys', () => {
        const result = detectSensitiveData(SENSITIVE_SAMPLES.apiKey);
        const hasApiKeyPattern = result.some(p => p.name === 'api-key');
        assert.strictEqual(hasApiKeyPattern, true);
    });

    it('Should detect AWS keys', () => {
        const result = detectSensitiveData(SENSITIVE_SAMPLES.awsKey);
        const hasAwsKeyPattern = result.some(p => p.name === 'aws-key');
        assert.strictEqual(hasAwsKeyPattern, true);
    });

    it('Should detect JWT tokens', () => {
        const result = detectSensitiveData(SENSITIVE_SAMPLES.jwt);
        const hasJwtPattern = result.some(p => p.name === 'jwt-token');
        assert.strictEqual(hasJwtPattern, true);
    });

    it('Should detect GitHub tokens', () => {
        const result = detectSensitiveData(SENSITIVE_SAMPLES.githubToken);
        const hasGithubPattern = result.some(p => p.name === 'github-token');
        assert.strictEqual(hasGithubPattern, true);
    });

    it('Should detect Slack tokens', () => {
        const result = detectSensitiveData(SENSITIVE_SAMPLES.slackToken);
        const hasSlackPattern = result.some(p => p.name === 'slack-token');
        assert.strictEqual(hasSlackPattern, true);
    });

    it('Should detect SSH keys', () => {
        const result = detectSensitiveData(SENSITIVE_SAMPLES.sshKey);
        const hasSshPattern = result.some(p => p.name === 'ssh-key');
        assert.strictEqual(hasSshPattern, true);
    });

    it('Should redact passwords preserving structure', () => {
        const result = redactSensitiveData(SENSITIVE_SAMPLES.password);
        assert.strictEqual(result.includes('MySecretPassword123'), false);
        assert.strictEqual(result.includes('[REDACTED]'), true);
        assert.strictEqual(result.includes('mysql -u root -p'), true);
    });

    it('Should redact API keys preserving structure', () => {
        const result = redactSensitiveData(SENSITIVE_SAMPLES.apiKey);
        assert.strictEqual(result.includes('sk-abc123xyz789def456'), false);
        assert.strictEqual(result.includes('[REDACTED]'), true);
        assert.strictEqual(result.includes('curl -H "Authorization: Bearer'), true);
    });

    it('Should redact AWS keys', () => {
        const result = redactSensitiveData(SENSITIVE_SAMPLES.awsKey);
        assert.strictEqual(result.includes('AKIAIOSFODNN7EXAMPLE'), false);
        assert.strictEqual(result.includes('[REDACTED]'), true);
        assert.strictEqual(result.includes('AWS_ACCESS_KEY_ID='), true);
    });

    it('Should redact JWT tokens', () => {
        const result = redactSensitiveData(SENSITIVE_SAMPLES.jwt);
        assert.strictEqual(result.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'), false);
        assert.strictEqual(result.includes('[REDACTED]'), true);
        assert.strictEqual(result.includes('Authorization: Bearer'), true);
    });

    it('Should redact GitHub tokens', () => {
        const result = redactSensitiveData(SENSITIVE_SAMPLES.githubToken);
        assert.strictEqual(result.includes('ghp_abcdefghijklmnopqrstuvwxyz1234567890'), false);
        assert.strictEqual(result.includes('[REDACTED]'), true);
    });

    it('Should redact Slack tokens', () => {
        const result = redactSensitiveData(SENSITIVE_SAMPLES.slackToken);
        assert.strictEqual(result.includes('xoxb-1234567890-abcdefghijklmnopqrstuvwx'), false);
        assert.strictEqual(result.includes('[REDACTED]'), true);
    });

    it('Should redact SSH keys', () => {
        const result = redactSensitiveData(SENSITIVE_SAMPLES.sshKey);
        assert.strictEqual(result.includes('MIIEpAIBAAKCAQEA'), false);
        assert.strictEqual(result.includes('[REDACTED]'), true);
        assert.strictEqual(result.includes('MIIEpAIBAAKCAQEA'), false);
    });

    it('Should exclude commands matching patterns', () => {
        const result = isExcludedCommand('mysql -p', testConfig);
        assert.strictEqual(result, true);
    });

    it('Should not exclude commands not matching patterns', () => {
        const result = isExcludedCommand('ls -la', testConfig);
        assert.strictEqual(result, false);
    });

    after(() => {
        const defaultConfig: ISecurityConfig = {
            detectionEnabled: true,
            redactionLevel: RedactionLevel.REDACT,
            customPatterns: [],
            excludedCommands: ['mysql.*', '.*secret.*'],
            warnOnDetection: true
        };
        setSecurityConfig(defaultConfig);
    });
});
