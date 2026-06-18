/**
 * Represents the output display in the TreeView
 * Used when expanding a command item
 */
export interface IOutputTreeItem {
    /** Cleaned output text */
    output: string;
    /** Exit code of the command */
    exitCode: number | null;
    /** The original command text */
    commandText: string;
}