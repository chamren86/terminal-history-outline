// Update SENSITIVE_SAMPLES
const SENSITIVE_SAMPLES = {
    password: 'mysql -u root -pMySecretPassword123',
    passwordColon: 'mysql -u root -p:MySecretPassword123',
    passwordEquals: 'mysql -u root --password=MySecretPassword123',
    // Fix: Make API key longer (20+ chars)
    apiKey: 'curl -H "Authorization: Bearer sk-abc123xyz789def456" https://api.example.com',
    awsKey: 'AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE',
    jwt: 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    githubToken: 'ghp_abcdefghijklmnopqrstuvwxyz1234567890',
    slackToken: 'xoxb-1234567890-abcdefghijklmnopqrstuvwx',
    // Fix: Use proper multiline string
    sshKey: `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
-----END RSA PRIVATE KEY-----`,
};