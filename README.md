# smile 

[![npm version](https://img.shields.io/npm/v/@mrjacket/smile.svg?color=success)](https://www.npmjs.com/package/@mrjacket/smile)
[![npm downloads](https://img.shields.io/npm/dm/@mrjacket/smile.svg)](https://www.npmjs.com/package/@mrjacket/smile)
[![node](https://img.shields.io/node/v/@mrjacket/smile.svg)](https://www.npmjs.com/package/@mrjacket/smile)
[![ci](https://github.com/x-name15/smile/actions/workflows/ci.yml/badge.svg)](https://github.com/x-name15/smile/actions/workflows/ci.yml)
[![types](https://img.shields.io/npm/types/@mrjacket/smile.svg)](https://www.npmjs.com/package/@mrjacket/smile)
[![license](https://img.shields.io/npm/l/@mrjacket/smile.svg)](https://github.com/x-name15/smile/blob/main/LICENSE)

**smile** is a strict API contract validator built for Node.js test suites and CI pipelines. 

### Why the name "smile"?
> Named after [Red John](https://en.wikipedia.org/wiki/Red_John) from [The Mentalist](https://en.wikipedia.org/wiki/The_Mentalist) (a show you should not watch until completion... and beware, the links has spoilers!). 

The smiley face is the mark that indicates the execution was perfect. Applied to backend development, this is a relentless tool that judges whether your API strictly complies with the established contract. If the API lies or breaches the contract, the test fails. When your specification passes perfectly, it signs the output with the *Smiley Face*. When it fails, it isolates and highlights the "crime scene".

It acts as both a static linter (checking your API specification for completeness) and a runtime validation engine (verifying that your live server's responses actually match the contract you wrote).

## Features

- **Multi-format support:** Auto-detects and validates OpenAPI 3.x, AsyncAPI 2.x, JSON Schema, and GraphQL SDL.
- **Zero dependencies for the CLI:** Run it via `npx` instantly in your CI pipelines.
- **Library API:** Native Vitest/Jest integration. Import it directly into your tests with full TypeScript support (no subprocesses).
- **The Breaching Detector:** Point `smile` at your live server and it will fire real HTTP requests against every documented endpoint, validating the runtime response body against the schema.
- **Built-in Rule Engine:** Opinionated, zero-configuration rules focused on documentation completeness and contract enforceability.
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

# Lint an entire directory (auto-discovers .yaml, .json, .graphql)
npx @mrjacket/smile lint .
```

> **Tip:** Create a `.smileignore` file in your root directory to tell `smile` which files or folders to skip (e.g. `node_modules`, `vendor/`), just like `.gitignore`!

You can optionally output the results as raw JSON for programmatic consumption:
```bash
npx @mrjacket/smile lint . --format json
```

*Supported formats: `.yaml`, `.yml`, `.json`, `.graphql`, `.gql`*

### 3. Runtime Validation (Breaching Detector)

Verify that your live server actually honors the contract:

```bash
# Smoke test against a live environment
smile test ./openapi.yaml https://api.staging.myserver.com

# Bundle a modular spec into a single JSON file
smile bundle ./openapi/main.yaml --out ./dist/api-bundle.json
```
> Note: Currently supports `GET` endpoints in OpenAPI specs.

### 4. Programmatic Usage (Vitest / Jest)

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

---

## Documentation

Full documentation is available in the [`docs/`](./docs) directory:

- [Getting Started](./docs/getting-started.md) — CLI usage, CI integration, and exit codes.
- [Library API](./docs/library.md) — Programmatic usage, Vitest integration, and working with violations.
- **Rules Reference**:
  - [OpenAPI](./docs/rules/openapi.md)
  - [AsyncAPI](./docs/rules/asyncapi.md)
  - [JSON Schema](./docs/rules/json-schema.md)
  - [GraphQL](./docs/rules/graphql.md)

* Use at least Node.js v22.12.0+.
* This tool assumes you are parsing JSON or YAML.

## Roadmap (Upcoming Features)

We are constantly expanding the strictness and capabilities of `smile`. Here is what is coming in future versions:

- **gRPC / Protocol Buffers (`.proto`)**: Static linting of service definitions and runtime validation of actual binary payloads against the contract.
- **Postman Collections**: Extracting implicit API contracts directly from existing Postman collections and enforcing them.
- **JSON:API / HAL**: Validating hypermedia conventions strictly.

## License

This project is licensed under the **GPL-3.0 License**. See the [LICENSE](./LICENSE) file for details.

### Credits
**Author:** Mr Jacket 