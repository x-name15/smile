# 😊 Smile API Linter

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-Smile%20API%20Linter-blue?logo=github)](https://github.com/marketplace/actions/smile-api-linter)
[![smile version](https://img.shields.io/npm/v/@mrjacket/smile.svg?label=smile&color=success)](https://www.npmjs.com/package/@mrjacket/smile)

Official GitHub Action for [smile](https://github.com/x-name15/smile) — the relentless API contract validator for OpenAPI, AsyncAPI, GraphQL, gRPC, JSON Schema, and Postman collections.

No `npm install`. No `setup-node`. Just drop it in your workflow.

## Usage

```yaml
- name: Lint API specs
  uses: x-name15/smile-action@v1
  with:
    spec-path: "."
    max-warnings: 0
```

## With GitHub Code Scanning (SARIF)

```yaml
- name: Lint API specs
  uses: x-name15/smile-action@v1
  with:
    spec-path: "."
    sarif-file: smile-results.sarif
    upload-sarif: "true"
```

Violations appear directly in the **Security → Code scanning** tab of your repository, with file locations, rule descriptions, and diff annotations.

## Inputs

| Input | Description | Default |
|---|---|---|
| `spec-path` | Path to file or directory containing specs | `.` |
| `format` | Output format: `text`, `json`, `markdown`, `junit`, `sarif` | `text` |
| `max-warnings` | Max warnings before failing (`-1` = unlimited) | `-1` |
| `fix` | Auto-fix safe issues (`operationId`, `summary`) before linting | `false` |
| `quiet` | Suppress CLI output, emit only errors | `false` |
| `sarif-file` | File path for SARIF output | `""` |
| `upload-sarif` | Auto-upload SARIF to GitHub Code Scanning | `false` |

## Outputs

| Output | Description |
|---|---|
| `sarif-file` | Path to the generated SARIF report (if requested) |

## Versioning

| Tag | Meaning |
|---|---|
| `@v1` | Latest stable v1.x.x — always up to date |
| `@v1.7.0` | Pinned to a specific release |

## Full documentation

→ [x-name15/smile](https://github.com/x-name15/smile)
→ [CI/CD Guide](https://github.com/x-name15/smile/blob/main/docs/ci-cd.md)
