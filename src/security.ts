/**
/**
 * @file security.ts
 * @description Security module for the Terminal History Outline VS Code extension.
 * 
 * This file handles:
 * - Detection of sensitive data using predefined and custom patterns
 * - Redaction of sensitive data with [REDACTED] placeholder
 * - Command exclusion based on user-defined patterns
 * - Configuration management for security settings
 * - User interaction for sensitive command handling
 * - Loading security configuration from VS Code settings
 * 
 * @module security
 */

import { RedactionAction, RedactionLevel } from './enums/index.js';
import { ISensitivePattern, ISecurityConfig } from './interfaces/index.js';
import { SENSITIVE_PATTERNS } from './constants/index.js';

/**
 * Default security configuration used when VS Code settings are not available.
 * 
 * @constant
 * @type {ISecurityConfig}
 */
const DEFAULT_CONFIG: ISecurityConfig = {
    detectionEnabled: true,
    redactionLevel: RedactionLevel.WARN,
    customPatterns: [],
    excludedCommands: [],
    warnOnDetection: true
};

/**
 * Current security configuration instance.
 * 
 * @type {ISecurityConfig}
 */
let currentConfig: ISecurityConfig = { ...DEFAULT_CONFIG };

/**
 * Updates the current security configuration.
 * 
 * @param {Partial<ISecurityConfig>} config - Partial configuration object to merge with existing config.
 * @returns {void}
 */
export function setSecurityConfig(config: Partial<ISecurityConfig>) {
    currentConfig = { ...currentConfig, ...config };
}

/**
 * Returns the current security configuration.
 * 
 * @returns {ISecurityConfig} The current security configuration.
 */
export function getSecurityConfig(): ISecurityConfig {
    return currentConfig;
}

/**
 * Detects sensitive data patterns in the given text.
 * 
 * @param {string} text - The text to check for sensitive data.
 * @param {ISecurityConfig} [config] - Optional custom configuration to use instead of current config.
 * @returns {ISensitivePattern[]} Array of detected sensitive patterns.
 * 
 * @description
 * This function:
 * 1. Checks if detection is enabled in the configuration
 * 2. Combines predefined patterns with user-defined custom patterns
 * 3. Tests each pattern against the text
 * 4. Returns all matching patterns found
 * 
 * @example
 * ```typescript
 * const patterns = detectSensitiveData('mysql -pMyPassword123');
 * // Returns [{ regex: /password[=:]\s*\S+/gi, name: 'password', description: 'Password in command' }]
 * ```
 */
export function detectSensitiveData(text: string, config?: ISecurityConfig): ISensitivePattern[] {
    const cfg = config || getSecurityConfig();
    if (!cfg.detectionEnabled) {
        return [];
    }
    
    const found: ISensitivePattern[] = [];
    const allPatterns = [...SENSITIVE_PATTERNS];
    
    // Add custom patterns from user configuration
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
    
    // Check each pattern against the text
    for (const pattern of allPatterns) {
        pattern.regex.lastIndex = 0;
        if (pattern.regex.test(text)) {
            found.push(pattern);
        }
    }
    
    return found;
}

/**
 * Redacts sensitive data from the given text by replacing matched patterns with [REDACTED].
 * 
 * @param {string} text - The text containing potentially sensitive data.
 * @param {ISecurityConfig} [config] - Optional custom configuration.
 * @returns {string} The text with sensitive data redacted.
 * 
 * @description
 * This function:
 * 1. Checks if redaction level is set to REDACT
 * 2. Applies all patterns (predefined and custom) to the text
 * 3. Preserves command structure while replacing sensitive values
 * 4. Handles multi-line matches (like SSH keys) specially
 */
export function redactSensitiveData(text: string, config?: ISecurityConfig): string {
    const cfg = config || getSecurityConfig();
    if (cfg.redactionLevel !== RedactionLevel.REDACT) {
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
            // Invalid regex pattern - skip it silently
        }
    }
    
    // Sort patterns by regex length (longer first) to handle multiline patterns properly
    const sortedPatterns = allPatterns.sort((a, b) => {
        const aLen = a.regex.source.length;
        const bLen = b.regex.source.length;
        return bLen - aLen;
    });
    
    // Apply each pattern to redact matching content
    for (const pattern of sortedPatterns) {
        redacted = redacted.replace(pattern.regex, (match) => {
            // For multi-line matches (like SSH keys), replace the entire block
            if (match.includes('\n') || match.includes('-----BEGIN')) {
                return '[REDACTED]';
            }
            
            // Preserve the structure while redacting the value
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
 * Checks if a command should be excluded based on user-defined patterns.
 * 
 * @param {string} command - The command to check.
 * @param {ISecurityConfig} [config] - Optional custom configuration.
 * @returns {boolean} True if the command should be excluded, false otherwise.
 * 
 * @description
 * This function:
 * 1. Gets the list of excluded command patterns from configuration
 * 2. Tests each pattern against the command
 * 3. Returns true if any pattern matches
 */
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

/**
 * Handles a command that contains sensitive data by showing a warning and getting user input.
 * 
 * @param {string} command - The command containing sensitive data.
 * @param {ISensitivePattern[]} patterns - The detected sensitive patterns.
 * @param {boolean} [showWarning=true] - Whether to show the warning notification.
 * @param {boolean} [showModal=false] - Whether to show as a modal dialog (blocks UI).
 * @returns {Promise<RedactionAction>} The user's action or automatic action based on configuration.
 * 
 * @description
 * This function:
 * 1. Checks if warnings are enabled in configuration
 * 2. If redaction level is BLOCK or REDACT, handles automatically
 * 3. Otherwise, shows a warning message with options:
 *    - Save Anyway (proceed)
 *    - Redact Sensitive Data (redact)
 *    - Block This Command (block)
 * 4. Returns the selected action
 */
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

/**
 * Determines if a command should be redacted or blocked based on configuration.
 * This is a synchronous version for auto-handling without user interaction.
 * 
 * @param {string} command - The command to check.
 * @param {ISecurityConfig} [config] - Optional custom configuration.
 * @returns {{ action: RedactionAction; reason: string }} The action to take and the reason.
 * 
 * @description
 * This function:
 * 1. Checks if detection is enabled
 * 2. Detects sensitive data in the command
 * 3. Checks if the command is excluded
 * 4. Returns the appropriate action based on configuration
 */
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

/**
 * Loads the security configuration from VS Code settings.
 * 
 * @returns {void}
 * 
 * @description
 * This function:
 * 1. Dynamically imports the VS Code module
 * 2. Reads security settings from VS Code configuration
 * 3. Maps string values to enum values
 * 4. Updates the current security configuration
 * 
 * @note This function is called from extension.ts on activation and when settings change.
 */
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