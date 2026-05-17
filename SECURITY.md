# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | ✅ Yes     |

## Reporting a Vulnerability

**Please do not file a public GitHub issue for security vulnerabilities.**

If you discover a security vulnerability, please report it responsibly:

1. **Email:** dhruv621999goyal@gmail.com  
   Subject line: `[SECURITY] AtomQuest Goals — <brief description>`

2. **Include in your report:**
   - A clear description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact (data exposure, privilege escalation, etc.)
   - Any suggested mitigations

3. **Response timeline:**
   - Acknowledgement within **48 hours**
   - Initial assessment within **5 business days**
   - Fix target within **14 days** for critical issues

## Security Measures in Place

- **Authentication:** NextAuth v5 with Azure AD (Entra ID) + bcrypt-hashed credentials
- **Authorisation:** Role-based access control enforced at middleware (Edge) level
- **Rate limiting:** Redis sliding-window rate limiter (100 req/min per user)
- **Input sanitisation:** All user-supplied strings sanitised before database writes
- **Security headers:** `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, strict `Referrer-Policy`, `Permissions-Policy`
- **Secrets:** All credentials stored as environment variables, never committed to source
- **Audit trail:** Every goal mutation is logged with actor, timestamp, and before/after values
- **HTTPS:** Enforced at the deployment layer (Vercel)

## Out of Scope

The following are explicitly **out of scope** for this project's security programme:

- Denial-of-service attacks against third-party services (MongoDB Atlas, Aiven Redis, Resend)
- Vulnerabilities in demo/seed data (all demo passwords are intentionally `demo123`)
- Social engineering attacks

## Disclosure Policy

We follow **coordinated disclosure**. Reporters who follow this policy responsibly will be credited (with their permission) in the release notes.
