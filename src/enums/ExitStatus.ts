/**
 * Represents the exit status of a command.
 * Used in command history items to indicate success/failure.
 */
export enum ExitStatus {
    /** Command is still running (exit code not yet determined) */
    RUNNING = -1,
    
    /** Command executed successfully */
    SUCCESS = 0,
    
    /** Command failed (non-zero exit code) */
    FAILED = 1
}