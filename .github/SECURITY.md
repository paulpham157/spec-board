# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

1. **Do NOT** open a public GitHub issue for security vulnerabilities
2. Email the maintainers directly or use GitHub's private vulnerability reporting feature
3. Include as much detail as possible:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment**: We will acknowledge receipt within 48 hours
- **Assessment**: We will assess the vulnerability and determine its severity
- **Updates**: We will keep you informed of our progress
- **Resolution**: We aim to resolve critical issues within 7 days

### Security Measures

SpecBoard implements the following security measures:

- **Path Traversal Protection**: File browser API restricts access to user directories only
- **Input Validation**: Project names validated against URL-safe slug patterns
- **XSS Prevention**: Markdown content sanitized with DOMPurify before rendering
- **File Path Validation**: All file operations verify directory existence and permissions

### Scope

The following are in scope for security reports:

- Authentication/authorization bypasses
- Path traversal vulnerabilities
- Cross-site scripting (XSS)
- SQL injection
- Remote code execution
- Information disclosure

### Out of Scope

- Denial of service attacks
- Social engineering
- Physical security
- Issues in dependencies (report to the dependency maintainer)

## Security Best Practices for Users

1. Keep SpecBoard updated to the latest version
2. Use strong database credentials
3. Run behind a reverse proxy with HTTPS in production
4. Limit network access to trusted users
5. Regularly review access logs
