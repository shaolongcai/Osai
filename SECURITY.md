# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 0.4.x   | :white_check_mark: |
| < 0.4.0 | :x:                |

## Reporting a Vulnerability

We take the security of Osai seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please do NOT:

* Open a public GitHub issue for security vulnerabilities
* Discuss the vulnerability publicly until it has been resolved
* Share the vulnerability with others before it has been addressed

### How to Report

Please report security vulnerabilities by emailing the maintainers. You can find contact information in the project's README.md file.

When reporting a security vulnerability, please include:

1. **Description of the vulnerability**
   - What the vulnerability is
   - What component or feature is affected

2. **Steps to reproduce**
   - Clear, concise steps to reproduce the issue
   - Include code samples, configuration files, or commands if applicable

3. **Potential impact**
   - What could an attacker achieve with this vulnerability?
   - What data or functionality could be compromised?

4. **Suggested fix (if any)**
   - If you have ideas on how to fix the issue, please share them

5. **Proof of concept (if available)**
   - Code or commands that demonstrate the vulnerability
   - Please ensure this is safe to share and does not expose sensitive data

### What to Expect

After you submit a security report:

1. **Acknowledgment** - We will acknowledge receipt of your report within 48 hours
2. **Initial Assessment** - We will provide an initial assessment within 7 days
3. **Updates** - We will keep you informed of our progress
4. **Resolution** - We will work to resolve the issue as quickly as possible

### Disclosure Policy

When we receive a security bug report, we will:

1. Confirm the issue and determine affected versions
2. Develop a fix for the latest supported version
3. Test the fix to ensure it resolves the vulnerability
4. Prepare security advisories and release notes
5. Release the fix in a new version
6. Credit the reporter (if desired)

We aim to resolve critical security vulnerabilities within 30 days of reporting. However, the timeline may vary depending on the complexity of the issue and the time required for testing.

### Security Best Practices for Contributors

If you are contributing to Osai, please follow these security best practices:

1. **Never commit secrets or credentials**
   - API keys, passwords, tokens, or other sensitive information
   - Use environment variables or secure configuration management

2. **Validate and sanitize user input**
   - Always validate user input on both client and server side
   - Sanitize data before storing or processing

3. **Use secure dependencies**
   - Keep dependencies up to date
   - Review and audit third-party packages for security vulnerabilities
   - Run `npm audit` regularly

4. **Follow secure coding practices**
   - Avoid unsafe operations that could lead to injection attacks
   - Use parameterized queries for database operations
   - Implement proper error handling without exposing sensitive information

5. **Handle sensitive data carefully**
   - Encrypt sensitive data at rest and in transit
   - Follow the principle of least privilege
   - Implement proper access controls

6. **Test security features**
   - Write tests for security-related functionality
   - Perform security testing before submitting pull requests

### Security Considerations for Osai

Osai handles local file indexing and search functionality. Key security considerations include:

1. **File System Access**
   - Osai requires file system access to index and search files
   - User data remains local and is not transmitted to external servers
   - Be cautious when processing files from untrusted sources

2. **Native Modules**
   - Native modules in `electron/native/` interact with the system at a low level
   - Ensure proper input validation and bounds checking

3. **OCR Processing**
   - OCR functionality processes image files
   - Be aware of potential issues with malicious or malformed image files

4. **AI/ML Models**
   - Local AI models process user data
   - Ensure models do not leak sensitive information
   - Validate and sanitize inputs to AI models

5. **Electron Security**
   - Follow Electron security best practices
   - Keep Electron and dependencies updated
   - Use contextIsolation and disable nodeIntegration in renderer processes

### Updates and Patches

Security updates will be released as:

- **Patch versions** (e.g., 0.4.1) for security fixes in the current minor version
- **Minor versions** (e.g., 0.5.0) may include security improvements along with new features
- **Major versions** (e.g., 1.0.0) may include breaking security-related changes

### Credits

We appreciate the security researchers and community members who help keep Osai secure. Security researchers who responsibly disclose vulnerabilities will be credited in release notes (with their permission).

Thank you for helping to keep Osai and its users safe!

