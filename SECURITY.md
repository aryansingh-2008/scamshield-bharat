# Security Policy — ScamShield Bharat

## Project Scope
ScamShield Bharat is an open-source, evidence-first investor safety and scam-detection platform developed to help Indian retail investors verify suspicious financial communications against official regulatory registries (SEBI, RBI, CERT-In, MHA 1930).

The security boundaries of this application encompass:
1. **Client-Side Privacy**: Redacting PII (Personal Identifiable Information) in-memory before transmission.
2. **Server-Side Verification**: Stateless, in-memory evaluation without persistence of user messages, credentials, or personal data.
3. **Deterministic Guardrails**: Strict refusal to offer investment advice, stock tips, buy/sell recommendations, or price predictions.
4. **Input Defense**: Payload size limits, rate limiting (IP-based), MIME-type and magic-byte inspection for uploads, and safe structural URL parsing without remote JavaScript execution.

---

## Reporting a Vulnerability

If you discover a potential security vulnerability, memory leak, or safety bypass in ScamShield Bharat, please report it responsibly.

### How to Report
- **GitHub Security Advisory**: Use the **Security** tab $\rightarrow$ **Report a vulnerability** on the GitHub repository.
- **Issue Tracker Guidelines**: Please do **NOT** open public issues for actively exploitable zero-day vulnerabilities. First disclose via private security advisory.

### What to Include in Your Report
To help us investigate and patch the issue promptly, please provide:
1. Description of the vulnerability and its potential impact.
2. Step-by-step reproduction steps or a minimal proof-of-concept payload.
3. Affected components, routes, or dependencies.
4. Suggested remediation if available.

---

## Responsible Disclosure & Response Timeline

- **Initial Acknowledgment**: Within 48 hours of submission.
- **Triage & Severity Assessment**: Within 5 business days.
- **Patch Release & Advisory Publication**: Dependent on severity, typically within 14–30 days.

---

## Security Boundaries & Limitations

- **No Active Network Exploitation**: ScamShield does not actively crawl or execute untrusted third-party JavaScript from submitted links; it performs structural and domain-reputation analysis only.
- **Advisory Nature**: ScamShield is an educational risk evaluation assistant and does not replace official law enforcement investigation or certified investment fiduciary consultation.
