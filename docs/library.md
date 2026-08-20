# Library API

`smile` is designed so that every CLI command has a direct programmatic
equivalent. You can call the same validation logic from your test suite,
build scripts, or any Node.js program — no subprocess, no stdout parsing,
full TypeScript types.

---

## Installation

```bash
npm install @mrjacket/smile
```

Requires Node.js 22.12.0+.

---

## Core concepts

All lint functions return a `Promise<ILintResult>`:

```ts
interface ILintResult {
  format: ESpecFormat;      // which format was detected/used
  passed: boolean;          // true if zero violations
  violations: IViolation[]; // empty array when passed is true
}

interface IViolation {
  ruleId: string;       // e.g. "missing-operation-id"
  severity: ESeverity;  // ESeverity.Error | ESeverity.Warning
  message: string;      // human-readable description
  path: string;         // dot-notation path into the spec
}

enum ESeverity {
  Error   = "error",
  Warning = "warning",
}

enum ESpecFormat {
  OpenApi    = "openapi",
  AsyncApi   = "asyncapi",
  JsonSchema = "json-schema",
  GraphQL    = "graphql",
  Grpc       = "grpc",
  Postman    = "postman",
}

interface ISmileConfig {
  rules?: Record<string, "error" | "warn" | "off">;
}
```

---

## Auto-detect format: `lintSpec`

The simplest way to lint any file. Detects the format automatically and
dispatches to the right linter — same logic as `smile lint <file>`. You can optionally pass a configuration object to downgrade or disable specific rules.

```ts
import { lintSpec } from "@mrjacket/smile";

const config = {
  rules: {
    "missing-operation-id": "warn",
    "untyped-property": "off"
  }
};

const result = await lintSpec("./api.yaml", config);

if (!result.passed) {
  for (const v of result.violations) {
    console.error(`[${v.severity}] ${v.ruleId}: ${v.message} (${v.path})`);
  }
  process.exit(1);
}
```

---

## Format-specific linters

Use these when you know the format ahead of time, or when you want
strict typing for a specific format.

```ts
import {
  lintOpenApiSpec,
  lintAsyncApiSpec,
  lintJsonSchemaSpec,
  lintGraphQLSpec,
  lintGrpcSpec,
  lintPostmanSpec,
} from "@mrjacket/smile";

// OpenAPI
const openApiResult = await lintOpenApiSpec("./openapi.yaml");

// AsyncAPI
const asyncApiResult = await lintAsyncApiSpec("./asyncapi.yaml");

// JSON Schema
const jsonSchemaResult = await lintJsonSchemaSpec("./schema.json");

// GraphQL SDL
const graphqlResult = await lintGraphQLSpec("./schema.graphql");

// gRPC
const grpcResult = await lintGrpcSpec("./service.proto");

// Postman Collection
const postmanResult = await lintPostmanSpec("./collection.json");
```

---

## Format detection only: `detectSpecFormat`

Detect the format of a file without linting it:

```ts
import { detectSpecFormat, ESpecFormat } from "@mrjacket/smile";

const format = detectSpecFormat("./openapi.yaml");
// → ESpecFormat.OpenApi

const gqlFormat = detectSpecFormat("./schema.graphql");
// → ESpecFormat.GraphQL
```

---

## Runtime validation: `validateResponseAgainstSchema`

Validate a parsed response body against a JSON Schema object:

```ts
import { validateResponseAgainstSchema } from "@mrjacket/smile";

const schema = {
  type: "object",
  required: ["id", "name"],
  properties: {
    id:   { type: "string" },
    name: { type: "string" },
  },
};

const body = { id: "u_1", name: "Felix" };
const violations = validateResponseAgainstSchema(schema, body, "GET /users/:id");

// violations is IViolation[] — empty means body matches the schema
```

---

## Runtime smoke test: `runSmokeTest`

> ⚠️ **WARNING:** `runSmokeTest` performs destructive HTTP requests (`POST`, `PUT`, `DELETE`). Run strictly against local or ephemeral environments to avoid accidental data loss!

Fire all supported documented endpoints against a live server and validate
every response body against the spec's declared schema:

```ts
import { runSmokeTest } from "@mrjacket/smile";

// Optional: pass custom headers if your API is protected
const headers = { Authorization: "Bearer my-token" };
const result = await runSmokeTest("./openapi.yaml", "http://localhost:3000", headers);

for (const r of result.endpoints) {
  if (!r.passed) {
    console.error(`${r.method} ${r.path} — ${r.violations.length} violation(s)`);
  }
}
```

For OpenAPI, `runSmokeTest` covers `GET`, `POST`, `PUT`, `PATCH`, and `DELETE`.
Request bodies for mutating methods are generated from JSON examples, defaults,
and simple schemas. Path parameters are auto-tested when they provide an
`example` or `default` value; otherwise the endpoint is reported as skipped.
Responses are decoded according to their `Content-Type`, so text and JSON
schemas can be validated correctly. Postman collections are traversed
recursively and preserve absolute request URLs.

The GraphQL runtime tester also supports schemas that map `query` to a custom
root type. Fields with required arguments remain skipped because Smile cannot
generate safe values for them automatically.

---

## Bundling specs: `bundleSpec`

Combine multi-file specifications (OpenAPI, AsyncAPI, JSON Schema) into a single resolved object by dereferencing external `$ref`s:

```ts
import { bundleSpec } from "@mrjacket/smile";
import { writeFileSync } from "node:fs";

const result = await bundleSpec("./openapi/main.yaml");

if (result.skipped) {
  console.log(result.message); // e.g. "GraphQL specifications do not use $ref..."
} else {
  writeFileSync("bundle.json", JSON.stringify(result.bundledData, null, 2));
}
```

---

## Integration with Vitest / Jest

The main use-case for the library: contract tests that run inside your
existing test suite without spawning any subprocess.

```ts
// contract.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import { lintSpec, runSmokeTest, validateResponseAgainstSchema } from "@mrjacket/smile";
import { app } from "./src/app.js";

let server: ReturnType<typeof app.listen>;
const BASE_URL = "http://localhost:4321";

beforeAll(() => {
  server = app.listen(4321);
  return () => server.close();
});

describe("API contract", () => {
  it("spec has zero lint violations", async () => {
    const result = await lintSpec("./openapi.yaml");
    // On failure, Vitest prints the exact violation objects — no ambiguity
    expect(result.violations).toEqual([]);
  });

  it("GET /users returns what the spec promises", async () => {
    const res = await fetch(`${BASE_URL}/users`);
    const body = await res.json();

    // Validate the actual runtime body against the spec schema
    const userSchema = {
      type: "array",
      items: {
        type: "object",
        required: ["id", "name"],
        properties: {
          id:   { type: "string" },
          name: { type: "string" },
        },
      },
    };

    const violations = validateResponseAgainstSchema(
      userSchema,
      body,
      "GET /users",
    );
    expect(violations).toHaveLength(0);
  });

  it("all endpoints respond with their documented schema (smoke)", async () => {
    const result = await runSmokeTest("./openapi.yaml", BASE_URL);
    const failed = result.endpoints.filter((r) => !r.passed && !r.skipped);

    // Custom message shows exactly which endpoint failed and why
    expect(failed).toHaveLength(0);
  });
});
```

---

## Working with violations

### Filter by severity

```ts
import { ESeverity } from "@mrjacket/smile";

const result = await lintSpec("./openapi.yaml");

const errors   = result.violations.filter((v) => v.severity === ESeverity.Error);
const warnings = result.violations.filter((v) => v.severity === ESeverity.Warning);

// Fail CI only on errors, tolerate warnings
if (errors.length > 0) process.exit(1);
```

### Group by rule

```ts
const byRule = result.violations.reduce<Record<string, typeof result.violations>>(
  (acc, v) => {
    acc[v.ruleId] = [...(acc[v.ruleId] ?? []), v];
    return acc;
  },
  {},
);

for (const [ruleId, violations] of Object.entries(byRule)) {
  console.log(`${ruleId}: ${violations.length} violation(s)`);
}
```

### Serialize to JSON (for CI integrations)

```ts
import { writeFileSync } from "node:fs";

const result = await lintSpec("./openapi.yaml");
writeFileSync("lint-results.json", JSON.stringify(result, null, 2));
```

---

## TypeScript types

All public types are exported from the package root:

```ts
import type {
  ILintResult,
  IViolation,
  ITestResult,
  IParsedSpec,
  ESeverity,
  ESpecFormat,
} from "@mrjacket/smile";
```

The package ships `.d.ts` declaration files for all public APIs.
No `@types/` package needed.
