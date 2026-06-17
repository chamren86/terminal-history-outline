/**
 * Security module for Terminal History Outline extension
 * Handles sensitive data detection, redaction, and command exclusion
 */

// Define sensitive data patterns
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
        // Match Bearer tokens with proper JWT format
        regex: /Bearer\s+[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_.+/=]*/g,
        name: 'jwt-token',
        description: 'JWT token'
    },
    {
        // Match OpenAI-style API keys (minimum 10 characters)
        regex: /sk-[A-Za-z0-9]{10,}/g,
        name: 'api-key',
        description: 'API key (OpenAI style)'
    },
    {
        // Match AWS keys (both access key and secret)
        regex: /(?:AKIA|ASIA)[0-9A-Z]{16}/g,
        name: 'aws-key',
        description: 'AWS access key'
    },
    {
        // Match SSH private keys with proper multiline handling
        regex: /-----BEGIN (?:RSA|DSA|EC|OPENSSH) PRIVATE KEY-----[\s\S]*?-----END (?:RSA|DSA|EC|OPENSSH) PRIVATE KEY-----/g,
        name: 'ssh-key',
        description: 'SSH private key'
    },
    {
        // Match GitHub tokens (both classic and fine-grained)
        regex: /gh[ps]_[A-Za-z0-9]{36,}/g,
        name: 'github-token',
        description: 'GitHub personal access token'
    },
    {
        // Match Slack tokens
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

// Default configuration (used when vscode isn't available)
const DEFAULT_CONFIG: SecurityConfig = {
    detectionEnabled: true,
    redactionLevel: 'warn',
    customPatterns: [],
    excludedCommands: [],
    warnOnDetection: true
};

let currentConfig: SecurityConfig = { ...DEFAULT_CONFIG };

/**
 * Set the security configuration
 * @param config Partial configuration to merge with existing
 */
export function setSecurityConfig(config: Partial<SecurityConfig>) {
    currentConfig = { ...currentConfig, ...config };
}

/**
 * Get the current security configuration
 * @returns The current security configuration
 */
export function getSecurityConfig(): SecurityConfig {
    return currentConfig;
}

/**
 * Detect sensitive data patterns in text
 * @param text The text to check
 * @param config Optional custom configuration
 * @returns Array of detected sensitive patterns
 */
export function detectSensitiveData(text: string, config?: SecurityConfig): SensitivePattern[] {
    const cfg = config || getSecurityConfig();
    if (!cfg.detectionEnabled) {
        return [];
    }
    
    const found: SensitivePattern[] = [];
    const allPatterns = [...SENSITIVE_PATTERNS];
    
    // Add custom patterns
    for (const patternStr of cfg.customPatterns) {
        try {
            const regex = new RegExp(patternStr, 'gi');
            allPatterns.push({
                regex,
                name: 'custom',
                description: `Custom pattern: ${patternStr}`
            });
        } catch (e) {
            console.error(`Invalid regex pattern: ${patternStr}`);
        }
    }
    
    // Check each pattern
    for (const pattern of allPatterns) {
        // Reset regex state
        pattern.regex.lastIndex = 0;
        if (pattern.regex.test(text)) {
            found.push(pattern);
        }
    }
    
    return found;
}

/**
 * Redact sensitive data from text
 * @param text The text to redact
 * @param config Optional custom configuration
 * @returns The redacted text
 */
export function redactSensitiveData(text: string, config?: SecurityConfig): string {
    const cfg = config || getSecurityConfig();
    if (cfg.redactionLevel !== 'redact') {
        return text;
    }
    
    let redacted = text;
    const allPatterns = [...SENSITIVE_PATTERNS];
    
    // Add custom patterns
    for (const patternStr of cfg.customPatterns) {
        try {
            const regex = new RegExp(patternStr, 'gi');
            allPatterns.push({
                regex,
                name: 'custom',
                description: `Custom pattern: ${patternStr}`
            });
        } catch (e) {
            console.error(`Invalid regex pattern: ${patternStr}`);
        }
    }
    
    // Sort patterns by regex length (longer first) to handle multiline patterns properly
    const sortedPatterns = allPatterns.sort((a, b) => {
        const aLen = a.regex.source.length;
        const bLen = b.regex.source.length;
        return bLen - aLen;
    });
    
    for (const pattern of sortedPatterns) {
        redacted = redacted.replace(pattern.regex, (match) => {
            // For multi-line matches (like SSH keys), replace the entire block
            if (match.includes('\n') || match.includes('-----BEGIN')) {
                return '[REDACTED]';
            }
            
            // Try to preserve the structure while redacting the value
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
                // Long token-like string
                return '[REDACTED]';
            } else {
                return '[REDACTED]';
            }
        });
    }
    
    return redacted;
}

/**
 * Check if a command should be excluded based on configured patterns
 * @param command The command to check
 * @param config Optional custom configuration
 * @returns True if the command should be excluded
 */
export function isExcludedCommand(command: string, config?: SecurityConfig): boolean {
    const cfg = config || getSecurityConfig();
    for (const pattern of cfg.excludedCommands) {
        try {
            const regex = new RegExp(pattern, 'i');
            if (regex.test(command)) {
                return true;
            }
        } catch (e) {
            console.error(`Invalid exclusion pattern: ${pattern}`);
        }
    }
    return false;
}

/**
 * Handle sensitive command detection with user interaction
 * This function is meant to be used with VS Code's window API
 * @param command The command to check
 * @param patterns The detected sensitive patterns
 * @param showWarning Whether to show a warning (default: true)
 * @param showModal Whether to show a modal dialog (default: false)
 * @returns Promise with action: 'proceed', 'redact', or 'block'
 */
export async function handleSensitiveCommand(
    command: string, 
    patterns: SensitivePattern[],
    showWarning: boolean = true,
    showModal: boolean = false
): Promise<'proceed' | 'redact' | 'block'> {
    const config = getSecurityConfig();
    
    // If warnings are disabled, just proceed
    if (!config.warnOnDetection || !showWarning) {
        return 'proceed';
    }
    
    // If redaction level is 'block', block the command
    if (config.redactionLevel === 'block') {
        return 'block';
    }
    
    // If redaction level is 'redact', automatically redact
    if (config.redactionLevel === 'redact') {
        return 'redact';
    }
    
    // Otherwise, show warning and ask user
    const patternNames = [...new Set(patterns.map(p => p.name))].join(', ');
    const truncatedCommand = command.length > 50 ? command.substring(0, 50) + '...' : command;
    
    // Dynamically import vscode only when needed (for user interaction)
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
    } catch (error) {
        // vscode not available (testing) - default to proceed
        console.warn('VS Code not available for user interaction, proceeding with command');
        return 'proceed';
    }
}

/**
 * Determine if a command should be redacted or blocked based on configuration
 * This is a synchronous version for auto-handling without user interaction
 * @param command The command to check
 * @param config Optional custom configuration
 * @returns Object with action and reason
 */
export function shouldRedactOrBlock(command: string, config?: SecurityConfig): { action: 'proceed' | 'redact' | 'block', reason: string } {
    const cfg = config || getSecurityConfig();
    
    // Check for sensitive data FIRST
    const patterns = detectSensitiveData(command, cfg);
    
    if (patterns.length === 0) {
        return { action: 'proceed', reason: 'No sensitive data detected' };
    }
    
    if (!cfg.detectionEnabled) {
        return { action: 'proceed', reason: 'Detection disabled' };
    }
    
    // Then check if command is excluded
    if (isExcludedCommand(command, cfg)) {
        return { action: 'block', reason: 'Command excluded by user settings' };
    }
    
    if (cfg.redactionLevel === 'block') {
        return { action: 'block', reason: 'Redaction level set to block' };
    }
    
    if (cfg.redactionLevel === 'redact') {
        return { action: 'redact', reason: 'Redaction level set to redact' };
    }
    
    // 'warn' or 'off' - proceed but user will be prompted
    return { action: 'proceed', reason: 'User will be prompted' };
}

/**
 * Load security configuration from VS Code settings
 * This is called from extension.ts to sync with VS Code's configuration
 */
export function loadConfigFromVSCode() {
    // Dynamically import vscode only when needed
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