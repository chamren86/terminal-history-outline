// Sample terminal outputs for testing

export const SAMPLE_OUTPUTS = {
    // Basic ANSI colors
    greenText: '\u001b[32mgreen text\u001b[0m',
    redText: '\u001b[31mred text\u001b[0m',
    boldText: '\u001b[1mbold text\u001b[0m',
    
    // VS Code shell integration
    vsCodeSequence: '\u001b]633;CDesktop\u001b]633;C Documents',
    vsCodeWithColors: '\u001b]633;C\u001b[0m\u001b[01;34mDesktop\u001b[0m  \u001b[01;34mDocuments\u001b[0m',
    
    // Complex outputs
    lsOutput: '\u001b]633;C\u001b[0m\u001b[01;34mDesktop\u001b[0m  \u001b[01;34mDownloads\u001b[0m  \u001b[01;34mPictures\u001b[0m',
    npmError: '\u001b[31mERROR\u001b[0m: command not found: npm',
    
    // Mixed content
    mixedContent: '\u001b[32mSuccess\u001b[0m: 3 files \u001b[33mmodified\u001b[0m, 2 \u001b[31mdeleted\u001b[0m',
    
    // Real-world examples
    gitStatus: '\u001b[32mon branch main\u001b[0m\n\u001b[33mmodified:   src/app.ts\u001b[0m',
    dockerLogs: '\u001b[36mINFO\u001b[0m: Container started\n\u001b[33mWARN\u001b[0m: Memory usage high\n\u001b[31mERROR\u001b[0m: Connection refused',
    
    // Different shells
    bashPrompt: 'user@host:~$ ls',
    zshPrompt: 'user@host ~ % ls',
    powershellPrompt: 'PS C:\\Users\\user> ls',
    
    // ANSI 24-bit RGB (modern terminals)
    rgbColor: '\u001b[38;2;255;100;50mRGB text\u001b[0m',
    
    // OSC 8 hyperlinks (VS Code supports these)
    hyperlink: '\u001b]8;;https://example.com\u001b\\link text\u001b]8;;\u001b\\',
    
    // Complex with brackets (should not strip legitimate brackets)
    bracketContent: '[WARNING] This has brackets [that should] remain',

    // New: Warning outputs
    deprecationWarning: 'DeprecationWarning: The `url.parse()` behavior is not standardized',
    npmWarning: 'npm warn deprecated inflight@1.0.6: This module is not supported',
    securityWarning: 'Potential security issue detected: Your extension package contains sensitive information',
    gitWarning: 'warning: The git repository has too many loose objects',
    
    // New: Error outputs
    gitError: "git: 'confit' is not a git command. See 'git --help'.",
    fatalError: 'fatal: not a git repository',
    commandNotFound: 'bash: ls: command not found',
    permissionDenied: 'permission denied: /root/file.txt'
};