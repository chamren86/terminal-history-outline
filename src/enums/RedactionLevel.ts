/**
 * User-configurable security levels for handling sensitive data.
 * Mapped from VS Code settings to enum values.
 */
export enum RedactionLevel {
    /** Ignore sensitive data entirely (no detection) */
    OFF = 'off',
    
    /** Show a warning when sensitive data is detected, let user decide */
    WARN = 'warn',
    
    /** Automatically redact sensitive data without prompting */
    REDACT = 'redact',
    
    /** Automatically block commands with sensitive data */
    BLOCK = 'block'
}