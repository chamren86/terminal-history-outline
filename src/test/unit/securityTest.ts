import * as assert from 'assert';
import { 
    detectSensitiveData, 
    redactSensitiveData, 
    isExcludedCommand,
    setSecurityConfig,
    shouldRedactOrBlock
} from '../../security.js';
import { SENSITIVE_PATTERNS } from '../../constants/sensitivePatterns.js';
import { RedactionAction, RedactionLevel } from '../../enums/index.js';
import { ISecurityConfig } from '../../interfaces/index.js';

// Use real-looking test data that matches the regex patterns
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

    describe('Sensitive Data Detection', () => {
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

        it('Should not flag normal commands as sensitive', () => {
            const normalCommands = [
                'ls -la',
                'echo "Hello World"',
                'npm install',
                'git status',
                'cd /home/user'
            ];
            
            for (const cmd of normalCommands) {
                const result = detectSensitiveData(cmd);
                assert.strictEqual(result.length, 0, `Command "${cmd}" should not have sensitive data`);
            }
        });

        it('Should be case insensitive', () => {
            const upperCase = detectSensitiveData('PASSWORD=secret123');
            const lowerCase = detectSensitiveData('password=secret123');
            
            assert.strictEqual(upperCase.length > 0, true);
            assert.strictEqual(lowerCase.length > 0, true);
        });

        it('Should respect detection disabled setting', () => {
            const disabledConfig: ISecurityConfig = {
                ...testConfig,
                detectionEnabled: false
            };
            
            const result = detectSensitiveData(SENSITIVE_SAMPLES.password, disabledConfig);
            assert.strictEqual(result.length, 0, 'Detection should be disabled');
        });

        it('Should handle custom patterns', () => {
            const customConfig: ISecurityConfig = {
                ...testConfig,
                customPatterns: ['CUSTOM_TOKEN=[A-Za-z0-9]+']
            };
            
            const result = detectSensitiveData('CUSTOM_TOKEN=abc123', customConfig);
            const hasCustomPattern = result.some(p => p.name === 'custom');
            assert.strictEqual(hasCustomPattern, true);
        });
    });

    describe('Sensitive Data Redaction', () => {
        it('Should redact passwords preserving structure', () => {
            const result = redactSensitiveData(SENSITIVE_SAMPLES.password);
            assert.strictEqual(result.includes('MySecretPassword123'), false);
            assert.strictEqual(result.includes('[REDACTED]'), true);
            assert.strictEqual(result.includes('mysql -u root -p'), true);
        });

        it('Should redact passwords with colon format', () => {
            const result = redactSensitiveData(SENSITIVE_SAMPLES.passwordColon);
            assert.strictEqual(result.includes('MySecretPassword123'), false);
            assert.strictEqual(result.includes('[REDACTED]'), true);
            assert.strictEqual(result.includes('mysql -u root -p:'), true);
        });

        it('Should redact passwords with equals format', () => {
            const result = redactSensitiveData(SENSITIVE_SAMPLES.passwordEquals);
            assert.strictEqual(result.includes('MySecretPassword123'), false);
            assert.strictEqual(result.includes('[REDACTED]'), true);
            assert.strictEqual(result.includes('mysql -u root --password='), true);
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

        it('Should not modify commands without sensitive data', () => {
            const normalCommand = 'ls -la';
            const result = redactSensitiveData(normalCommand);
            assert.strictEqual(result, normalCommand);
        });

        it('Should respect redaction level setting', () => {
            const warnConfig: ISecurityConfig = {
                ...testConfig,
                redactionLevel: RedactionLevel.WARN
            };
            
            const result = redactSensitiveData(SENSITIVE_SAMPLES.password, warnConfig);
            assert.strictEqual(result.includes('MySecretPassword123'), true);
            assert.strictEqual(result.includes('[REDACTED]'), false);
        });
    });

    describe('Command Exclusion', () => {
        it('Should exclude commands matching patterns', () => {
            const result = isExcludedCommand('mysql -p', testConfig);
            assert.strictEqual(result, true);
        });

        it('Should exclude commands matching secret pattern', () => {
            const result = isExcludedCommand('my-secret-command', testConfig);
            assert.strictEqual(result, true);
        });

        it('Should not exclude commands not matching patterns', () => {
            const result = isExcludedCommand('ls -la', testConfig);
            assert.strictEqual(result, false);
        });

        it('Should handle invalid regex patterns gracefully', () => {
            const invalidConfig: ISecurityConfig = {
                ...testConfig,
                excludedCommands: ['[invalid']
            };
            
            const result = isExcludedCommand('test command', invalidConfig);
            assert.strictEqual(result, false);
        });

        it('Should use default config when no config provided', () => {
            const result = isExcludedCommand('mysql -p');
            assert.strictEqual(typeof result, 'boolean');
        });
    });

    describe('Pattern Definitions', () => {
        it('Should have all required pattern properties', () => {
            for (const pattern of SENSITIVE_PATTERNS) {
                assert.strictEqual(typeof pattern.regex, 'object');
                assert.strictEqual(typeof pattern.name, 'string');
                assert.strictEqual(typeof pattern.description, 'string');
            }
        });

        it('Should have the major pattern categories covered', () => {
            const names = SENSITIVE_PATTERNS.map(p => p.name);
            const majorCategories = ['password', 'api-key', 'aws-key', 'jwt-token', 'github-token', 'slack-token', 'ssh-key'];
            for (const category of majorCategories) {
                assert.strictEqual(names.includes(category), true, `Missing pattern category: ${category}`);
            }
        });

        it('Should have working regex patterns', () => {
            for (const pattern of SENSITIVE_PATTERNS) {
                pattern.regex.lastIndex = 0;
                assert.strictEqual(typeof pattern.regex.test('test'), 'boolean');
            }
        });
    });

    describe('Sensitive Data Handling', () => {
        it('should auto-redact when redaction level is set to redact', () => {
            const redactConfig: ISecurityConfig = {
                ...testConfig,
                redactionLevel: RedactionLevel.REDACT,
                excludedCommands: []
            };
            setSecurityConfig(redactConfig);
            
            const result = shouldRedactOrBlock(SENSITIVE_SAMPLES.password);
            assert.strictEqual(result.action, RedactionAction.REDACT);
            assert.strictEqual(result.reason, 'Redaction level set to redact');
        });

        it('should auto-block when redaction level is set to block', () => {
            const blockConfig: ISecurityConfig = {
                ...testConfig,
                redactionLevel: RedactionLevel.BLOCK,
                excludedCommands: []
            };
            setSecurityConfig(blockConfig);
            
            const result = shouldRedactOrBlock(SENSITIVE_SAMPLES.password);
            assert.strictEqual(result.action, RedactionAction.BLOCK);
            assert.strictEqual(result.reason, 'Redaction level set to block');
        });

        it('should proceed when detection is disabled', () => {
            const disabledConfig: ISecurityConfig = {
                ...testConfig,
                detectionEnabled: false
            };
            setSecurityConfig(disabledConfig);
            
            const result = shouldRedactOrBlock(SENSITIVE_SAMPLES.password);
            assert.strictEqual(result.action, RedactionAction.PROCEED);
            assert.strictEqual(result.reason, 'Detection disabled');
        });

        it('should proceed when no sensitive data is detected', () => {
            const defaultConfig: ISecurityConfig = {
                detectionEnabled: true,
                redactionLevel: RedactionLevel.REDACT,
                customPatterns: [],
                excludedCommands: [],
                warnOnDetection: true
            };
            setSecurityConfig(defaultConfig);
            
            const result = shouldRedactOrBlock('ls -la');
            assert.strictEqual(result.action, RedactionAction.PROCEED);
            assert.strictEqual(result.reason, 'No sensitive data detected');
        });

        it('should prompt user when redaction level is set to warn', () => {
            const warnConfig: ISecurityConfig = {
                ...testConfig,
                redactionLevel: RedactionLevel.WARN,
                excludedCommands: []
            };
            setSecurityConfig(warnConfig);
            
            const result = shouldRedactOrBlock(SENSITIVE_SAMPLES.password);
            assert.strictEqual(result.action, RedactionAction.PROCEED);
            assert.strictEqual(result.reason, 'User will be prompted');
        });
    });
});

afterAll(() => {
    const defaultConfig: ISecurityConfig = {
        detectionEnabled: true,
        redactionLevel: RedactionLevel.REDACT,
        customPatterns: [],
        excludedCommands: ['mysql.*', '.*secret.*'],
        warnOnDetection: true
    };
    setSecurityConfig(defaultConfig);
});