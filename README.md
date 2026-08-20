# smile 

[![npm version](https://img.shields.io/npm/v/@mrjacket/smile.svg?color=success)](https://www.npmjs.com/package/@mrjacket/smile)
[![npm downloads](https://img.shields.io/npm/dm/@mrjacket/smile.svg)](https://www.npmjs.com/package/@mrjacket/smile)
[![node](https://img.shields.io/node/v/@mrjacket/smile.svg)](https://www.npmjs.com/package/@mrjacket/smile)
[![ci](https://github.com/x-name15/smile/actions/workflows/ci.yml/badge.svg)](https://github.com/x-name15/smile/actions/workflows/ci.yml)
[![types](https://img.shields.io/npm/types/@mrjacket/smile.svg)](https://www.npmjs.com/package/@mrjacket/smile)
[![license](https://img.shields.io/npm/l/@mrjacket/smile.svg)](https://github.com/x-name15/smile/blob/main/LICENSE)

**smile** is a strict API contract validator built for Node.js test suites and CI pipelines. 

### Why the name "smile"?
> Named after [Red John](https://en.wikipedia.org/wiki/Red_John) from [The Mentalist](https://en.wikipedia.org/wiki/The_Mentalist) (A show you absolutely must watch... and beware, the links has spoilers!). 

The smiley face is the mark that indicates the execution was perfect. Applied to backend development, this is a relentless tool that judges whether your API strictly complies with the established contract. If the API lies or breaches the contract, the test fails. When your specification passes perfectly, it signs the output with the *Smiley Face*. When it fails, it isolates and highlights the "crime scene".

It acts as both a static linter (checking your API specification for completeness) and a runtime validation engine (verifying that your live server's responses actually match the contract you wrote).

## Features

- **Multi-format support:** Auto-detects and validates OpenAPI 3.x, AsyncAPI 2.x, JSON Schema, GraphQL SDL, gRPC (`.proto`), and Postman Collections.
- **Zero dependencies for the CLI:** Run it via `npx` instantly in your CI pipelines.
- **Library API:** Native Vitest/Jest integration. Import it directly into your tests with full TypeScript support (no subprocesses).
- **The Breaching Detector (Runtime Smoke Test)**

> ⚠️ **WARNING:** `smile test` performs actual HTTP requests against the provided server. It will execute `GET`, `POST`, `PUT`, `PATCH`, and `DELETE` requests using auto-generated fake data if your spec defines them. **This will create, modify, and delete real data.** You should run this strictly against local, staging, or ephemeral environments. We are not responsible for accidental data loss in production.

`smile test` takes your spec and a base URL, fires a real HTTP requests against every documented endpoint, validating the runtime response body against the schema.
- **Built-in Rule Engine:** Opinionated, zero-configuration rules focused on documentation completeness and contract enforceability.
- **Plugin System:** Extend smile with your own custom rules written in plain JavaScript. Load them via `config.smile.json` or the `--plugin` CLI flag.
- **Incremental Adoption:** Customize rule severities (`error`, `warn`, `off`) via `config.smile.json` without breaking CI/CD.

---

## Quick Start

### 1. Initialization (Scaffolding)

Run the interactive setup wizard to instantly configure `smile` in your project. It will optionally generate a smart configuration file, a GitHub Actions CI workflow, and a sample API boilerplate.

```bash
npx @mrjacket/smile init
```

### 2. Static Linting (CLI)

Lint any specification file instantly. `smile` exits with code `1` if violations are found, making it perfect for CI/CD.

```bash
# Lint a specific file
npx @mrjacket/smile lint ./openapi.yaml

# Lint an entire directory (auto-discovers supported specification files)
npx @mrjacket/smile lint .
```

> **Tip:** Create a `.smileignore` file in your root directory to tell `smile` which files or folders to skip (e.g. `node_modules`, `vendor/`), just like `.gitignore`!

You can optionally output the results as raw JSON, Markdown, or JUnit (for CI/CD dashboards):
```bash
npx @mrjacket/smile lint . --format json
npx @mrjacket/smile lint . --format markdown > report.md
npx @mrjacket/smile lint . --format junit > junit.xml
```

To suppress all CLI menus and art in CI environments, use the `--quiet` or `-q` flag:
```bash
npx @mrjacket/smile lint . --quiet
```

*Supported formats: `.yaml`, `.yml`, `.json`, `.graphql`, `.gql`, `.proto`*

### 3. Smile Deduce (Interactive Auto-Fixer) 

If you have a lot of missing summaries, operation IDs, or channel descriptions, you don't have to fix them manually. Smile Deduce will read your OpenAPI or AsyncAPI file, prompt you interactively in the terminal for the missing data, and safely save the YAML (preserving all your `# comments` and formatting!). 

For **GraphQL**, it even acts as a smart naming assistant, automatically suggesting CamelCase and PascalCase corrections for your types and fields and safely injecting them!

```bash
npx @mrjacket/smile deduce ./openapi.yaml
```

### 4. Runtime Validation (Breaching Detector)

> ⚠️ **WARNING:** `smile test` performs destructive HTTP requests (`POST`, `PUT`, `DELETE`). Run strictly against local or ephemeral environments to avoid accidental data loss!

Verify that your live server actually honors the contract:

```bash
# Smoke test against a live environment
smile test ./openapi.yaml https://api.staging.myserver.com

# Bundle a modular spec into a single JSON file
smile bundle ./openapi/main.yaml --out ./dist/api-bundle.json
```
> Note: OpenAPI runtime tests support `GET`, `POST`, `PUT`, `PATCH`, and `DELETE`. Path parameters need an `example` or `default` value to be auto-tested. Postman Collections are traversed recursively, and absolute request URLs are preserved.

### 5. Programmatic Usage (Vitest / Jest)

Install it as a dev dependency to use inside your integration tests:

```bash
npm install --save-dev @mrjacket/smile
```

```ts
import { validateResponseAgainstSchema } from "@mrjacket/smile";

it("GET /users returns a valid payload according to the spec", async () => {
  const response = await fetch("http://localhost:3000/users");
  const body = await response.json();
  
  const violations = validateResponseAgainstSchema(userSchema, body, "GET /users");
  expect(violations).toHaveLength(0);
});
```

---

## Configuration (`config.smile.json`)

By default, `smile` is extremely strict—all rules emit an `Error` and break the CI build.
For enterprise adoption, you can downgrade or disable rules by creating a configuration file in your project root. 
The CLI supports the following filenames: `config.smile.json`, `smile.config.json`, `.smilerc.json`, or `smile.json`.

```json
{
  "rules": {
    "missing-operation-id": "warn",
    "untyped-property": "off"
  }
}
```
*Rules set to `"warn"` will print yellow alerts in the CLI but will exit with code `0` (Success).*

### Inline Suppressions (YAML Only)
If you need to bypass a rule on a single specific line without changing the global configuration, you can use the `# smile-ignore-next-line <ruleId>` comment directly in your `.yaml` or `.yml` specifications.

```yaml
paths:
  /users:
    get:
      # smile-ignore-next-line missing-summary
      operationId: getUsers
```

---

## Documentation

Full documentation is available in the [`docs/`](./docs) directory:

- [Getting Started](./docs/getting-started.md) — CLI usage, basic commands, and exit codes.
- [CI/CD & DevOps](./docs/ci-cd.md) — GitHub Actions, GitLab CI, JUnit, and Webhooks.
- [Writing Plugins](./docs/plugins.md) — How to write and inject custom JavaScript/TypeScript rules.
- [Library API](./docs/library.md) — Programmatic usage, Vitest integration, and working with violations.
- [Configuration](./docs/configuration.md) — Complete guide to customizing rules, webhooks, and test headers in your config.smile.json.
- **Rules Reference**:
  - [OpenAPI](./docs/rules/openapi.md)
  - [AsyncAPI](./docs/rules/asyncapi.md)
  - [JSON Schema](./docs/rules/json-schema.md)
  - [GraphQL](./docs/rules/graphql.md)
  - [gRPC](./docs/rules/grpc.md)
  - [Postman](./docs/rules/postman.md)

* Use at least Node.js v22.12.0+.
* This tool assumes you are parsing JSON or YAML.

## Roadmap (Upcoming Features)

We are constantly expanding the strictness and capabilities of `smile`. Here is what is coming in future versions:
- **v1.6.0 AsyncAPI Runtime Validation**: Extending the Breaching Detector to connect to live message brokers (Kafka/RabbitMQ) and validate message payloads in real-time.
- **v1.7.0 AsyncAPI v3 Migration**: Rewriting the underlying parser to support `@asyncapi/parser` v3+ and its new AST structure.

## License

This project is licensed under the **GPL-3.0 License**. See the [LICENSE](./LICENSE) file for details.

### Credits
**Author:** Mr Jacket 