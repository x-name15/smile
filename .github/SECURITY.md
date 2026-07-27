# Security Policy

## Supported versions

Security fixes are applied only to the **latest published version** of `@mrjacket/smile`.

| Version        | Supported      |
|----------------|----------------|
| Latest release | ✅              |
| Older releases | ❌              |

If you are using an older version, please upgrade before reporting a vulnerability.

---

## Reporting a vulnerability

If you believe you have found a security vulnerability in `smile`,
**please do not open a public GitHub Issue**.

Report it privately using **GitHub Security Advisories**:
> Repository → Security tab → Report a vulnerability

Please include as much information as possible:

- Package version (`@mrjacket/smile@x.y.z`)
- Node.js version
- Steps to reproduce
- Proof-of-concept or exploit code (if available)
- Impact assessment

---

## Response process

After receiving a report:

1. Acknowledgement within **72 hours**.
2. Investigation and reproduction of the issue.
3. Fix development if the issue is confirmed.
4. Coordinated disclosure.
5. Patched release and security advisory published.

---

## Scope

`smile` is a **static analysis and HTTP testing tool** — it reads spec files from disk
and makes outbound HTTP GET requests to URLs you provide. Its attack surface is narrow.

Issues that **are** considered security vulnerabilities:

- Arbitrary file read/write when parsing a malicious spec file
- Code execution triggered by a crafted YAML or JSON spec
- Dependency vulnerabilities in `@apidevtools/swagger-parser`, `@asyncapi/parser`, or `ajv`
  with a concrete exploit path through smile's public API

Issues that generally **are not** considered security vulnerabilities:

- Crashes when parsing invalid (but non-malicious) specs
- Performance issues without security impact
- Vulnerabilities in dev dependencies (not shipped in the published package)
- Feature requests

---

Thank you for helping keep `smile` safe.
