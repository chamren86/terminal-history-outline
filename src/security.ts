/**
 * Security module for Terminal History Outline extension
 * Handles sensitive data detection, redaction, and command exclusion
 */

export interface SensitivePattern {
    regex: RegExp;
    name: string;
    description: string;
}

export const SENSITIVE_PATTERNS: SensitivePattern[] = [
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

export interface SecurityConfig {
    detectionEnabled: boolean;
    redactionLevel: 'off' | 'warn' | 'redact' | 'block';
    customPatterns: string[];
    excludedCommands: string[];
    warnOnDetection: boolean;
}

const DEFAULT_CONFIG: SecurityConfig = {
    detectionEnabled: true,
    redactionLevel: 'warn',
    customPatterns: [],
    excludedCommands: [],
    warnOnDetection: true
};

let currentConfig: SecurityConfig = { ...DEFAULT_CONFIG };

export function setSecurityConfig(config: Partial<SecurityConfig>) {
    currentConfig = { ...currentConfig, ...config };
}

export function getSecurityConfig(): SecurityConfig {
    return currentConfig;
}

export function detectSensitiveData(text: string, config?: SecurityConfig): SensitivePattern[] {
    const cfg = config || getSecurityConfig();
    if (!cfg.detectionEnabled) {
        return [];
    }
    
    const found: SensitivePattern[] = [];
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

export function redactSensitiveData(text: string, config?: SecurityConfig): string {
    const cfg = config || getSecurityConfig();
    if (cfg.redactionLevel !== 'redact') {
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

export function isExcludedCommand(command: string, config?: SecurityConfig): boolean {
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
    patterns: SensitivePattern[],
    showWarning: boolean = true,
    showModal: boolean = false
): Promise<'proceed' | 'redact' | 'block'> {
    const config = getSecurityConfig();
    
    if (!config.warnOnDetection || !showWarning) {
        return 'proceed';
    }
    
    if (config.redactionLevel === 'block') {
        return 'block';
    }
    
    if (config.redactionLevel === 'redact') {
        return 'redact';
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
                return 'redact';
            case 'Block This Command':
                return 'block';
            default:
                return 'proceed';
        }
    } catch {
        // vscode not available (testing) - default to proceed
        return 'proceed';
    }
}

export function shouldRedactOrBlock(command: string, config?: SecurityConfig): { action: 'proceed' | 'redact' | 'block', reason: string } {
    const cfg = config || getSecurityConfig();
    
    // Check detection disabled first
    if (!cfg.detectionEnabled) {
        return { action: 'proceed', reason: 'Detection disabled' };
    }
    
    const patterns = detectSensitiveData(command, cfg);
    if (patterns.length === 0) {
        return { action: 'proceed', reason: 'No sensitive data detected' };
    }
    
    // Check excluded commands BEFORE redaction level
    if (isExcludedCommand(command, cfg)) {
        return { action: 'block', reason: 'Command excluded by user settings' };
    }
    
    if (cfg.redactionLevel === 'block') {
        return { action: 'block', reason: 'Redaction level set to block' };
    }
    
    if (cfg.redactionLevel === 'redact') {
        return { action: 'redact', reason: 'Redaction level set to redact' };
    }
    
    return { action: 'proceed', reason: 'User will be prompted' };
}

export function loadConfigFromVSCode() {
    import('vscode')
        .then((vscode) => {
            const config = vscode.workspace.getConfiguration('terminalHistory');
            setSecurityConfig({
                detectionEnabled: config.get('security.detectionEnabled', true),
                redactionLevel: config.get('security.redactionLevel', 'warn'),
                customPatterns: config.get('security.customPatterns', []),
                excludedCommands: config.get('security.excludedCommands', []),
                warnOnDetection: config.get('security.warnOnDetection', true)
            });
        })
        .catch(() => {
            // vscode not available (testing), use defaults
        });
}
