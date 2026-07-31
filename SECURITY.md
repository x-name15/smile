# Security Policy

## Supported Versions

Currently, only the latest release (`v1.4.x` and onwards) receives security updates.

## Reporting a Vulnerability

If you discover a security vulnerability within Smile, please open an issue in the repository or contact the maintainers directly. We appreciate your efforts to responsibly disclose your findings.

## Known Security False Positives (CodeQL)

Smile is actively scanned using GitHub CodeQL. Because of the nature of the tool (an API CLI tester and contract validator), some standard security rules inherently trigger false positives. We document them here for transparency:

### 1. File Data in Outbound Network Request (CWE-200 / CWE-400 / Data Exfiltration)
- **Rule ID:** `js/file-data-in-network-request`
- **Description:** CodeQL flags when data is read from a local file and then sent over the network.
- **Why it's a false positive:** The `smile test` command (Breaching Detector) is specifically designed to read your local API specification (OpenAPI, Postman, etc.) and send requests to a target API server to validate its responses. It is literally impossible for the tool to function without sending file-derived data over HTTP.
- **Remediation:** We have globally suppressed this rule in our CodeQL configuration (`.github/codeql/codeql-config.yml`).
