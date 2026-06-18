/**
 * Security module for Terminal History Outline extension
 * Handles sensitive data detection, redaction, and command exclusion
 */

import { RedactionAction, RedactionLevel } from './enums/index.js';
import { ISensitivePattern, ISecurityConfig } from './interfaces/index.js';

export const SENSITIVE_PATTERNS: ISensitivePattern[] = [
    {
        regex: /password[=:]\s*\S+/gi,
        name: 'password',
        description: 'Password in command'
    },
    {
        regex: /pass[=:]\s*\S+/gi,
        name: 'password',
        description: 'Password in command'
    },
    {
        regex: /-p\s*\S+(?!\w)/g,
        name: 'password',
        description: 'Password parameter'
    },
    {
        regex: /--password[=:]\s*\S+/gi,
        name: 'password',
        description: 'Password parameter'
    },
    {
        regex: /Bearer\s+[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_.+/=]*/g,
        name: 'jwt-token',
        description: 'JWT token'
    },
    {
        regex: /sk-[A-Za-z0-9]{10,}/g,
        name: 'api-key',
        description: 'API key (OpenAI style)'
    },
    {
        regex: /(?:AKIA|ASIA)[0-9A-Z]{16}/g,
        name: 'aws-key',
        description: 'AWS access key'
    },
    {
        regex: /-----BEGIN (?:RSA|DSA|EC|OPENSSH) PRIVATE KEY-----[\s\S]*?-----END (?:RSA|DSA|EC|OPENSSH) PRIVATE KEY-----/g,
        name: 'ssh-key',
        description: 'SSH private key'
    },
    {
        regex: /gh[ps]_[A-Za-z0-9]{36,}/g,
        name: 'github-token',
        description: 'GitHub personal access token'
    },
    {
        regex: /xox[baprs]-[0-9A-Za-z\-]+/g,
        name: 'slack-token',
        description: 'Slack token'
    }
];

const DEFAULT_CONFIG: ISecurityConfig = {
    detectionEnabled: true,
    redactionLevel: RedactionLevel.WARN,
    customPatterns: [],
    excludedCommands: [],
    warnOnDetection: true
};

let currentConfig: ISecurityConfig = { ...DEFAULT_CONFIG };

export function setSecurityConfig(config: Partial<ISecurityConfig>) {
    currentConfig = { ...currentConfig, ...config };
}

export function getSecurityConfig(): ISecurityConfig {
    return currentConfig;
}

export function detectSensitiveData(text: string, config?: ISecurityConfig): ISensitivePattern[] {
    const cfg = config || getSecurityConfig();
    if (!cfg.detectionEnabled) {
        return [];
    }
    
    const found: ISensitivePattern[] = [];
    const allPatterns = [...SENSITIVE_PATTERNS];
    
    for (const patternStr of cfg.customPatterns) {
        try {
            const regex = new RegExp(patternStr, 'gi');
            allPatterns.push({
                regex,
                name: 'custom',
                description: `Custom pattern: ${patternStr}`
            });
        } catch (e) {
            // Invalid regex pattern - skip it silently
        }
    }
    
    for (const pattern of allPatterns) {
        pattern.regex.lastIndex = 0;
        if (pattern.regex.test(text)) {
            found.push(pattern);
        }
    }
    
    return found;
}

export function redactSensitiveData(text: string, config?: ISecurityConfig): string {
    const cfg = config || getSecurityConfig();
    if (cfg.redactionLevel !== RedactionLevel.REDACT) {
        return text;
    }
    
    let redacted = text;
    const allPatterns = [...SENSITIVE_PATTERNS];
    
    for (const patternStr of cfg.customPatterns) {
        try {
            const regex = new RegExp(patternStr, 'gi');
            allPatterns.push({
                regex,
                name: 'custom',
                description: `Custom pattern: ${patternStr}`
            });
        } catch (e) {
            // Invalid regex pattern - skip it silently
        }
    }
    
    const sortedPatterns = allPatterns.sort((a, b) => {
        const aLen = a.regex.source.length;
        const bLen = b.regex.source.length;
        return bLen - aLen;
    });
    
    for (const pattern of sortedPatterns) {
        redacted = redacted.replace(pattern.regex, (match) => {
            if (match.includes('\n') || match.includes('-----BEGIN')) {
                return '[REDACTED]';
            }
            
            if (match.includes('=')) {
                return match.replace(/=.*/, '=[REDACTED]');
            } else if (match.includes(':')) {
                return match.replace(/:.*/, ':[REDACTED]');
            } else if (match.startsWith('-p')) {
                return '-p [REDACTED]';
            } else if (match.startsWith('--password')) {
                return '--password [REDACTED]';
            } else if (match.startsWith('Bearer')) {
                return 'Bearer [REDACTED]';
            } else if (match.length > 20 && !match.includes(' ')) {
                return '[REDACTED]';
            } else {
                return '[REDACTED]';
            }
        });
    }
    
    return redacted;
}

export function isExcludedCommand(command: string, config?: ISecurityConfig): boolean {
    const cfg = config || getSecurityConfig();
    for (const pattern of cfg.excludedCommands) {
        try {
            const regex = new RegExp(pattern, 'i');
            if (regex.test(command)) {
                return true;
            }
        } catch (e) {
            // Invalid regex pattern - skip it silently
        }
    }
    return false;
}

export async function handleSensitiveCommand(
    command: string, 
    patterns: ISensitivePattern[],
    showWarning: boolean = true,
    showModal: boolean = false
): Promise<RedactionAction> {
    const config = getSecurityConfig();
    
    if (!config.warnOnDetection || !showWarning) {
        return RedactionAction.PROCEED;
    }
    
    if (config.redactionLevel === RedactionLevel.BLOCK) {
        return RedactionAction.BLOCK;
    }
    
    if (config.redactionLevel === RedactionLevel.REDACT) {
        return RedactionAction.REDACT;
    }
    
    const patternNames = [...new Set(patterns.map(p => p.name))].join(', ');
    const truncatedCommand = command.length > 50 ? command.substring(0, 50) + '...' : command;
    
    try {
        const vscode = await import('vscode');
        const choice = await vscode.window.showWarningMessage(
            `⚠️ Sensitive data detected in command: "${truncatedCommand}"\n` +
            `Patterns found: ${patternNames}\n\n` +
            `This command may contain passwords, API keys, or other secrets.`,
            { modal: showModal },
            'Save Anyway',
            'Redact Sensitive Data',
            'Block This Command'
        );
        
        switch (choice) {
            case 'Redact Sensitive Data':
                return RedactionAction.REDACT;
            case 'Block This Command':
                return RedactionAction.BLOCK;
            default:
                return RedactionAction.PROCEED;
        }
    } catch {
        // vscode not available (testing) - default to proceed
        return RedactionAction.PROCEED;
    }
}

export function shouldRedactOrBlock(
    command: string, 
    config?: ISecurityConfig
): { action: RedactionAction; reason: string } {
    const cfg = config || getSecurityConfig();
    
    if (!cfg.detectionEnabled) {
        return { action: RedactionAction.PROCEED, reason: 'Detection disabled' };
    }
    
    const patterns = detectSensitiveData(command, cfg);
    if (patterns.length === 0) {
        return { action: RedactionAction.PROCEED, reason: 'No sensitive data detected' };
    }
    
    if (isExcludedCommand(command, cfg)) {
        return { action: RedactionAction.BLOCK, reason: 'Command excluded by user settings' };
    }
    
    if (cfg.redactionLevel === RedactionLevel.BLOCK) {
        return { action: RedactionAction.BLOCK, reason: 'Redaction level set to block' };
    }
    
    if (cfg.redactionLevel === RedactionLevel.REDACT) {
        return { action: RedactionAction.REDACT, reason: 'Redaction level set to redact' };
    }
    
    return { action: RedactionAction.PROCEED, reason: 'User will be prompted' };
}

export function loadConfigFromVSCode() {
    import('vscode')
        .then((vscode) => {
            const config = vscode.workspace.getConfiguration('terminalHistory');
            const level = config.get<string>('security.redactionLevel', 'warn');
            
            // Map string to enum
            let redactionLevel: RedactionLevel;
            switch (level) {
                case 'off': redactionLevel = RedactionLevel.OFF; break;
                case 'warn': redactionLevel = RedactionLevel.WARN; break;
                case 'redact': redactionLevel = RedactionLevel.REDACT; break;
                case 'block': redactionLevel = RedactionLevel.BLOCK; break;
                default: redactionLevel = RedactionLevel.WARN;
            }
            
            setSecurityConfig({
                detectionEnabled: config.get('security.detectionEnabled', true),
                redactionLevel: redactionLevel,
                customPatterns: config.get('security.customPatterns', []),
                excludedCommands: config.get('security.excludedCommands', []),
                warnOnDetection: config.get('security.warnOnDetection', true)
            });
        })
        .catch(() => {
            // vscode not available (testing), use defaults
        });
}