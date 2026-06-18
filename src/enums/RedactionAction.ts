/**
 * Represents the possible actions to take when sensitive data is detected.
 * Used by the security module to determine how to handle a command.
 */
export enum RedactionAction {
    /** Save the command as-is, without any modification */
    PROCEED = 'proceed',
    
    /** Replace sensitive values with [REDACTED] */
    REDACT = 'redact',
    
    /** Do not save the command at all */
    BLOCK = 'block'
}