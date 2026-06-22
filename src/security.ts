/**
 * @file security.ts
 * @description Security module for detecting and redacting sensitive data in commands
 * 
 * This module provides:
 * - Detection of sensitive patterns (passwords, API keys, tokens, etc.)
 * - Redaction of sensitive data from commands
 * - Command exclusion based on patterns
 * - Configuration management for security settings
 * 
 * @module security
 */

import * as vscode from 'vscode';
import { SENSITIVE_PATTERNS } from './constants/index.js';
import { RedactionAction } from './enums/RedactionAction.js';
import { RedactionLevel } from './enums/index.js';
import { ISecurityConfig, ISensitivePattern } from './interfaces/index.js';

// Default security configuration
let securityConfig: ISecurityConfig = {
    detectionEnabled: true,
    redactionLevel: RedactionLevel.REDACT,
    customPatterns: [],
    excludedCommands: [],
    warnOnDetection: true
};

/**
 * Gets the current security configuration
 * @returns The current security configuration
 */
export function getSecurityConfig(): ISecurityConfig {
    return { ...securityConfig };
}

/**
 * Sets the security configuration
 * @param config - The new security configuration
 */
export function setSecurityConfig(config: ISecurityConfig): void {
    securityConfig = { ...config };
}

/**
 * Loads security configuration from VS Code settings
 * This function should be called during extension activation
 */
export function loadConfigFromVSCode(): void {
    try {
        const config = vscode.workspace.getConfiguration('terminalHistory.security');
        securityConfig = {
            detectionEnabled: config.get('detectionEnabled', true),
            redactionLevel: config.get('redactionLevel', RedactionLevel.REDACT),
            customPatterns: config.get('customPatterns', []),
            excludedCommands: config.get('excludedCommands', []),
            warnOnDetection: config.get('warnOnDetection', true)
        };
    } catch (error) {
        // Use default config if VS Code API is not available (e.g., in tests)
        securityConfig = {
            detectionEnabled: true,
            redactionLevel: RedactionLevel.REDACT,
            customPatterns: [],
            excludedCommands: [],
            warnOnDetection: true
        };
    }
}

/**
 * Detects sensitive data in a command string
 * 
 * @param text - The command text to check for sensitive data
 * @param config - Optional security configuration (uses global config if not provided)
 * @returns Array of detected sensitive patterns
 */
export function detectSensitiveData(text: string, config?: ISecurityConfig): ISensitivePattern[] {
    const cfg = config || securityConfig;
    if (!cfg.detectionEnabled || !text) {
        return [];
    }

    const found: ISensitivePattern[] = [];
    const allPatterns = [...SENSITIVE_PATTERNS];

    // Add custom patterns from configuration
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
 * Redacts sensitive data from a command string using the same patterns
 * used for detection.
 * 
 * @param text - The command text that may contain sensitive data
 * @param config - Optional security configuration (uses global config if not provided)
 * @returns The command text with sensitive data redacted
 */
export function redactSensitiveData(text: string, config?: ISecurityConfig): string {
    if (!text) return text;
    
    const cfg = config || securityConfig;
    if (!cfg.detectionEnabled) {
        return text;
    }

    let redacted = text;
    const allPatterns = [...SENSITIVE_PATTERNS];

    // Add custom patterns from configuration
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

    // Sort patterns by length (longest first) to avoid partial redactions
    const sortedPatterns = allPatterns.sort((a, b) => {
        const aLen = a.regex.source.length;
        const bLen = b.regex.source.length;
        return bLen - aLen;
    });

    // Apply each pattern to redact the text
    for (const pattern of sortedPatterns) {
        pattern.regex.lastIndex = 0;
        
        redacted = redacted.replace(pattern.regex, (match: string) => {
            const patternName = pattern.name || '';
            
            // Password patterns
            if (patternName === 'password') {
                if (match.match(/^-p[^\s]+/)) {
                    return match.replace(/^-p[^\s]+/, '-p[REDACTED]');
                }
                if (match.match(/^-p\s+\S+/)) {
                    return match.replace(/(^-p\s+)(\S+)/, '$1[REDACTED]');
                }
                if (match.includes('=')) {
                    return match.replace(/=(.+)$/, '=[REDACTED]');
                }
                return match.replace(/(password[=:]\s*)(\S+)/i, '$1[REDACTED]');
            }
            
            // API key patterns
            if (patternName === 'api-key') {
                if (match.match(/Bearer\s+\S+/)) {
                    return match.replace(/(Bearer\s+)(\S+)/, '$1[REDACTED]');
                }
                if (match.includes('=')) {
                    return match.replace(/=(.+)$/, '=[REDACTED]');
                }
                return '[REDACTED]';
            }
            
            // AWS keys - pattern name is 'aws-key'
            if (patternName === 'aws-key') {
                // The regex matches the key value (e.g., AKIAIOSFODNN7EXAMPLE)
                // We want to replace just the value part
                // But since the regex only matches the value, we replace the whole match
                return '[REDACTED]';
}
            
            // JWT tokens
            if (patternName === 'jwt-token') {
                if (match.match(/Bearer\s+\S+/)) {
                    return match.replace(/(Bearer\s+)(\S+)/, '$1[REDACTED]');
                }
                return match.replace(/(\S+)$/, '[REDACTED]');
            }
            
            // GitHub tokens
            if (patternName === 'github-token') {
                return match.replace(/(ghp_[a-zA-Z0-9]+)/, 'ghp_[REDACTED]');
            }
            
            // Slack tokens
            if (patternName === 'slack-token') {
                return match.replace(/(xox[bap]-[a-zA-Z0-9-]+)/, 'xox[REDACTED]');
            }
            
            // SSH keys
            if (patternName === 'ssh-key') {
                return '[REDACTED SSH KEY]';
            }
            
            // Default
            return '[REDACTED]';
        });
    }

    return redacted;
}

/**
 * Determines if a command should be redacted or blocked based on security settings
 * 
 * @param command - The command to check
 * @param config - Optional security configuration (uses global config if not provided)
 * @returns An object with the action and reason
 */
export function shouldRedactOrBlock(command: string, config?: ISecurityConfig): { action: RedactionAction; reason?: string } {
    const cfg = config || securityConfig;
    
    if (!cfg.detectionEnabled) {
        return { action: RedactionAction.PROCEED };
    }

    const sensitivePatterns = detectSensitiveData(command, cfg);
    if (sensitivePatterns.length === 0) {
        return { action: RedactionAction.PROCEED };
    }

    // Check if the command matches any excluded patterns
    if (isExcludedCommand(command, cfg)) {
        return { 
            action: RedactionAction.BLOCK, 
            reason: 'Command matches excluded pattern' 
        };
    }

    // Determine action based on redaction level
    switch (cfg.redactionLevel) {
        case RedactionLevel.OFF:
            return { action: RedactionAction.PROCEED };
        case RedactionLevel.WARN:
            return { 
                action: RedactionAction.PROCEED, 
                reason: 'Sensitive data detected in command' 
            };
        case RedactionLevel.REDACT:
            return { 
                action: RedactionAction.REDACT, 
                reason: 'Sensitive data redacted from command' 
            };
        case RedactionLevel.BLOCK:
            return { 
                action: RedactionAction.BLOCK, 
                reason: 'Sensitive data blocked from command' 
            };
        default:
            return { action: RedactionAction.PROCEED };
    }
}

/**
 * Handles a command with sensitive data by showing a user prompt
 * 
 * @param command - The command with sensitive data
 * @param patterns - The detected sensitive patterns
 * @returns A promise that resolves to the user's action
 */
export async function handleSensitiveCommand(
    command: string,
    patterns: ISensitivePattern[]
): Promise<RedactionAction> {
    const patternNames = patterns.map(p => p.name).join(', ');
    
    const options = ['Redact', 'Block', 'Proceed'];
    const result = await vscode.window.showWarningMessage(
        `⚠️ Sensitive data detected (${patternNames}) in command: ${command.substring(0, 100)}${command.length > 100 ? '...' : ''}`,
        { modal: true },
        ...options
    );

    switch (result) {
        case 'Redact':
            return RedactionAction.REDACT;
        case 'Block':
            return RedactionAction.BLOCK;
        case 'Proceed':
            return RedactionAction.PROCEED;
        default:
            // If user closes the dialog, default to redact
            return RedactionAction.REDACT;
    }
}

/**
 * Checks if a command should be excluded based on excluded patterns
 * 
 * @param command - The command to check
 * @param config - Optional security configuration (uses global config if not provided)
 * @returns True if the command matches an excluded pattern
 */
export function isExcludedCommand(command: string, config?: ISecurityConfig): boolean {
    const cfg = config || securityConfig;
    if (!cfg.excludedCommands || cfg.excludedCommands.length === 0) {
        return false;
    }

    for (const patternStr of cfg.excludedCommands) {
        try {
            const regex = new RegExp(patternStr, 'i');
            if (regex.test(command)) {
                return true;
            }
        } catch (e) {
            // Invalid regex pattern - skip it
        }
    }
    return false;
}