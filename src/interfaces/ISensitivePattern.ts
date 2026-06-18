/**
 * Represents a pattern for detecting sensitive data in commands.
 * Used by the security module to identify passwords, API keys, tokens, etc.
 */
export interface ISensitivePattern {
    /** The regular expression to match against */
    regex: RegExp;
    /** The name of the pattern type (e.g., 'password', 'api-key') */
    name: string;
    /** A human-readable description of what this pattern detects */
    description: string;
}