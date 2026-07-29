# Getting Started

`smile` is a strict API contract validator. It reads your spec file, lints it
against a set of rules, and — if you give it a running server — fires real HTTP
requests and checks that the responses match what the spec promises.

It works without any account, and without any external service. Out of the box, it requires zero configuration, but for large enterprise projects, you can incrementally adopt rules via `config.smile.json`.

---

## Installation

### As a global CLI tool

```bash
npm install -g @mrjacket/smile
smile --version
```

### As a one-off runner (no install)

```bash
npx @mrjacket/smile lint ./openapi.yaml
```

### As a project dependency (for programmatic use or CI)

```bash
npm install --save-dev @mrjacket/smile
```

---

## Linting a spec file

`smile lint` reads your spec, detects its format automatically, and reports any
violations it finds.

```bash
smile lint ./openapi.yaml
smile lint ./asyncapi.yaml
smile lint ./schema.json       # JSON Schema
smile lint ./schema.graphql    # GraphQL SDL
```

### What you'll see on a passing spec

```
⠀⠀⠀⠀⠀⠀⣴⣶⣶⣶⣶⣮⣽⣗⣢⠤⣤⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠉⠛⠿⠿⠿⠿⢿⣿⣿⣶⣮⣽⣒⠤⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠛⢻⣿⣿⣮⡟⣤⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⡄⠀⠀⠀⠀⠀⠀⠈⠙⠛⠿⣿⣷⣄⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⢀⣠⣴⣿⣿⣿⠗⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢿⣿⣄⠀⠀⠀⠀
⠀⠀⠀⠀⠀⣀⣴⣿⡿⠟⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠻⣿⣿⣀⠀⠀
⠀⠀⠀⢀⣾⣿⠿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢻⣿⡆⠀
⠀⠀⢰⣿⡿⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⣿⡀
⠀⢠⣿⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣶⣾⣿⣦⡀⠀⠀⠀⠀⠀⠀⢻⣧
⠀⣿⣿⠃⠀⠀⠀⢀⣴⣾⣿⣿⣷⠄⠀⠀⠀⢰⠛⠟⠛⠿⣿⡿⣇⠀⠀⠀⠀⠀⠸⣿
⢸⣿⡏⠀⠀⠀⠀⣾⣿⠏⠉⠈⠁⠀⠀⠀⠀⠈⠀⠀⠀⠀⠸⡇⠀⠀⠀⠀⠀⠀⠀⣿
⢸⣿⡇⠀⠀⠀⠠⣸⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢈⡇⠀⠀⠀⠀⠀⠀⠀⣿
⢸⣿⣇⠀⠀⠀⠀⢸⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢈⡇⠀⠀⠀⠀⠀⠀⢰⡇
⠘⣿⣿⡄⠀⠀⠀⢸⠃⢀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣬⣴⡇⠀⠀⠀⠀⠀⢠⣿⠃
⠀⠙⣿⣷⣄⠀⠀⢸⡀⠘⢿⣷⣤⣀⣀⣠⣤⣤⣴⣾⡿⠟⠁⠁⠀⠀⠀⠀⣴⡿⠃⠀
⠀⠀⠈⢿⣿⣦⠀⢸⠀⠀⢀⡟⠻⠟⣿⠿⠿⠿⡿⠉⠀⠀⠀⠀⠀⠀⣀⣾⠟⠁⠀⠀
⠀⠀⠀⠀⠙⢿⣿⣼⣀⠀⠸⡇⠀⠀⣿⠀⠀⠀⠀⠀⠀⠀⠀⣠⣴⣾⠟⠁⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠙⠿⣿⣷⣦⣄⣀⣀⣿⡀⣀⣀⣀⣤⣴⣶⣿⠟⠉⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠻⣿⣿⣿⣿⣿⣿⣿⣿⠿⠿⠛⠠⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⠀⠈⠉⠉⠉⠀⠀⠀⠀⠀⠀⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢈⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀

 openapi spec signed clean — no violations.
```

### What you'll see when there are violations

```
🚫  openapi spec broke contract — 3 violation(s) found.

🔴 Scene 1 — paths./users.get
   rule:    missing-operation-id
   detail:  Operation "GET /users" is missing an operationId

🟡 Scene 2 — paths./users.post.summary
   rule:    missing-summary
   detail:  Operation "POST /users" is missing a summary

🔴 Scene 3 — paths./users/{id}.delete.responses
   rule:    no-2xx-response
   detail:  Operation "DELETE /users/{id}" defines no 2xx success response
```

### Exit codes

| Code | Meaning |
|------|---------|
| `0` | Spec is clean — no violations |
| `1` | One or more violations found |
| `2` | Spec could not be parsed (file not found, invalid syntax, etc.) |

Exit codes make `smile lint` directly usable in CI pipelines — a non-zero exit
will fail the pipeline automatically.

---

## Configuration (`config.smile.json`)

`smile` is extremely strict by default: all internal rules are treated as **errors**. If any rule is broken, the CLI will exit with code `1`, causing your CI pipeline to fail.

However, if you are introducing `smile` to a massive legacy project, you may want to downgrade some rules to warnings or turn them off completely. You can do this by placing a configuration file in the directory where you run the CLI.

The CLI automatically looks for any of the following filenames in this exact order:
1. `config.smile.json`
2. `smile.config.json`
3. `.smilerc.json`
4. `smile.json`

```json
{
  "rules": {
    "missing-operation-id": "warn",
    "untyped-schema-property": "off"
  }
}
```

- **`"error"`**: Fails the build (Exit Code 1).
- **`"warn"`**: Prints a yellow `🟡` warning in the terminal but allows the build to pass (Exit Code 0).
- **`"off"`**: Completely suppresses the rule.

### Available Rules

Here is the complete list of rules you can configure, broken down by format:

**OpenAPI**
- `missing-summary`
- `missing-operation-id`
- `untyped-schema-property`

**AsyncAPI**
- `missing-channel-description`
- `missing-message-description`
- `untyped-schema-property`

**GraphQL**
- `missing-type-description`
- `missing-field-description`
- `deprecated-without-reason`
- `missing-enum-value-description`

**JSON Schema**
- `missing-title`
- `missing-description`
- `untyped-property`

If you have 0 errors but 3 warnings, `smile` will print the warnings natively, print the Smile Signature, and successfully exit with `0`.

---

## The Breaching Detector (Runtime Smoke Test)

`smile smoke` takes your spec and a base URL, fires a real HTTP `GET` request
against every documented endpoint, and validates the actual response body against
the schema the spec promises.

```bash
smile smoke ./openapi.yaml http://localhost:3000
smile smoke ./openapi.yaml https://api.staging.example.com
```

### What you'll see

```
Testing against http://localhost:3000 — 2 endpoint(s) tested, 0 skipped

✅ GET /users — matches contract

🚫 GET /products — contract breached

🔴 Scene 1 — (root)
   rule:    missing-property
   detail:  missing required field "price"

🔴 Scene 2 — properties.stock
   rule:    invalid-type
   detail:  expected number, got string
```

> **Note:** The Breaching Detector only supports `GET` requests and OpenAPI specs.
> Support for other methods and AsyncAPI runtime validation is on the roadmap.

---

## Bundling multi-file specs

If your OpenAPI, AsyncAPI, or JSON Schema is split across multiple files using `$ref`, you can bundle them into a single, fully-resolved JSON file for deployment or documentation platforms:

```bash
smile bundle ./openapi/main.yaml --out ./dist/api-bundle.json
```

> **Note:** GraphQL does not use `$ref` mathematically, so bundling is not applicable to `.graphql` files.

---

## Using smile in CI

Because `smile` exits with code `1` on violations, you can use it directly in
any CI system without any extra configuration.

### GitHub Actions

```yaml
- name: Lint API spec
  run: npx @mrjacket/smile lint ./openapi.yaml

- name: Smoke test staging
  run: npx @mrjacket/smile smoke ./openapi.yaml ${{ vars.STAGING_URL }}
```

### Pre-commit hook (with Husky)

```bash
# .husky/pre-commit
npx @mrjacket/smile lint ./openapi.yaml
```

---

## Supported formats

| Format | Detection | Rules |
|--------|-----------|-------|
| OpenAPI 3.x | `openapi:` key in file | 5 rules |
| AsyncAPI 2.x | `asyncapi:` key in file | 5 rules |
| JSON Schema | `$schema:` key in file | 4 rules |
| GraphQL SDL | `.graphql` / `.gql` extension | 4 rules |

For the full list of rules and what each one checks, see the
[rules reference](./rules/).
