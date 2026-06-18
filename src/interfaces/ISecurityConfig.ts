import { RedactionLevel } from '../enums/index.js';

/**
 * Configuration settings for the security module
 * Maps directly to VS Code settings with 'terminalHistory.security' prefix
 */
export interface ISecurityConfig {
    /** Enable/disable all sensitive data detection */
    detectionEnabled: boolean;
    /** How to handle detected sensitive data */
    redactionLevel: RedactionLevel;
    /** User-defined custom regex patterns */
    customPatterns: string[];
    /** Commands that should never be saved */
    excludedCommands: string[];
    /** Whether to show warning notifications */
    warnOnDetection: boolean;
}