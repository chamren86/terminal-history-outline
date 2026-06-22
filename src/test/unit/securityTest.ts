/**
 * @file securityTest.ts
 * @description Unit tests for security module
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as vscode from 'vscode';
import { 
    detectSensitiveData, 
    redactSensitiveData, 
    isExcludedCommand,
    setSecurityConfig
} from '../../security.js';
import { RedactionLevel } from '../../enums/index.js';
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
    beforeAll(() => {
        setSecurityConfig(testConfig);
    });

    afterAll(() => {
        const defaultConfig: ISecurityConfig = {
            detectionEnabled: true,
            redactionLevel: RedactionLevel.REDACT,
            customPatterns: [],
            excludedCommands: [],
            warnOnDetection: true
        };
        setSecurityConfig(defaultConfig);
    });

    describe('Sensitive Data Detection', () => {
        it('Should detect passwords in commands', () => {
            const result = detectSensitiveData(SENSITIVE_SAMPLES.password);
            const hasPasswordPattern = result.some(p => p.name === 'password');
            expect(hasPasswordPattern).toBe(true);
        });

        it('Should detect passwords with colon format', () => {
            const result = detectSensitiveData(SENSITIVE_SAMPLES.passwordColon);
            const hasPasswordPattern = result.some(p => p.name === 'password');
            expect(hasPasswordPattern).toBe(true);
        });

        it('Should detect passwords with equals format', () => {
            const result = detectSensitiveData(SENSITIVE_SAMPLES.passwordEquals);
            const hasPasswordPattern = result.some(p => p.name === 'password');
            expect(hasPasswordPattern).toBe(true);
        });

        it('Should detect API keys', () => {
            const result = detectSensitiveData(SENSITIVE_SAMPLES.apiKey);
            const hasApiKeyPattern = result.some(p => p.name === 'api-key');
            expect(hasApiKeyPattern).toBe(true);
        });

        it('Should detect AWS keys', () => {
            const result = detectSensitiveData(SENSITIVE_SAMPLES.awsKey);
            const hasAwsKeyPattern = result.some(p => p.name === 'aws-key');
            expect(hasAwsKeyPattern).toBe(true);
        });

        it('Should detect JWT tokens', () => {
            const result = detectSensitiveData(SENSITIVE_SAMPLES.jwt);
            const hasJwtPattern = result.some(p => p.name === 'jwt-token');
            expect(hasJwtPattern).toBe(true);
        });

        it('Should detect GitHub tokens', () => {
            const result = detectSensitiveData(SENSITIVE_SAMPLES.githubToken);
            const hasGithubPattern = result.some(p => p.name === 'github-token');
            expect(hasGithubPattern).toBe(true);
        });

        it('Should detect Slack tokens', () => {
            const result = detectSensitiveData(SENSITIVE_SAMPLES.slackToken);
            const hasSlackPattern = result.some(p => p.name === 'slack-token');
            expect(hasSlackPattern).toBe(true);
        });

        it('Should detect SSH keys', () => {
            const result = detectSensitiveData(SENSITIVE_SAMPLES.sshKey);
            const hasSshPattern = result.some(p => p.name === 'ssh-key');
            expect(hasSshPattern).toBe(true);
        });
    });

    describe('Redaction', () => {
        it('Should redact passwords preserving structure', () => {
            const result = redactSensitiveData(SENSITIVE_SAMPLES.password);
            expect(result.includes('MySecretPassword123')).toBe(false);
            expect(result.includes('[REDACTED]')).toBe(true);
            expect(result.includes('mysql -u root -p')).toBe(true);
        });

        it('Should redact API keys preserving structure', () => {
            const result = redactSensitiveData(SENSITIVE_SAMPLES.apiKey);
            expect(result.includes('sk-abc123xyz789def456')).toBe(false);
            expect(result.includes('[REDACTED]')).toBe(true);
            expect(result.includes('curl -H "Authorization: Bearer')).toBe(true);
        });

        it('Should redact AWS keys', () => {
            const result = redactSensitiveData(SENSITIVE_SAMPLES.awsKey);
            expect(result.includes('AKIAIOSFODNN7EXAMPLE')).toBe(false);
            expect(result.includes('[REDACTED]')).toBe(true);
            expect(result).not.toBe(SENSITIVE_SAMPLES.awsKey);
        });

        it('Should redact Slack tokens', () => {
            const result = redactSensitiveData(SENSITIVE_SAMPLES.slackToken);
            expect(result.includes('xoxb-1234567890-abcdefghijklmnopqrstuvwx')).toBe(false);
            expect(result.includes('xox')).toBe(true);
            expect(result).not.toBe(SENSITIVE_SAMPLES.slackToken);
        });

        it('Should redact SSH keys', () => {
            const result = redactSensitiveData(SENSITIVE_SAMPLES.sshKey);
            expect(result).toBe('[REDACTED SSH KEY]');
            expect(result.includes('MIIEpAIBAAKCAQEA')).toBe(false);
        });

        it('Should redact JWT tokens', () => {
            const result = redactSensitiveData(SENSITIVE_SAMPLES.jwt);
            expect(result.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')).toBe(false);
            expect(result.includes('[REDACTED]')).toBe(true);
            expect(result.includes('Authorization: Bearer')).toBe(true);
        });

        it('Should redact GitHub tokens', () => {
            const result = redactSensitiveData(SENSITIVE_SAMPLES.githubToken);
            expect(result.includes('ghp_abcdefghijklmnopqrstuvwxyz1234567890')).toBe(false);
            expect(result.includes('[REDACTED]')).toBe(true);
        });
    });

    describe('Excluded Commands', () => {
        it('Should exclude commands matching patterns', () => {
            const result = isExcludedCommand('mysql -p', testConfig);
            expect(result).toBe(true);
        });

        it('Should not exclude commands not matching patterns', () => {
            const result = isExcludedCommand('ls -la', testConfig);
            expect(result).toBe(false);
        });
    });
});