# Smile Configuration

`smile` is strict by default. Out of the box, it will enforce all rules with maximum severity (Exit Code 1) and complain if your API documentation is missing key details.

However, we understand that not every legacy project can be fixed overnight. If you want to temporarily relax some rules to pass the CI while your team works on them, you can create a configuration file.

## Creating a Configuration File

You can place a configuration file in the root of your repository (where you run the `smile` CLI). `smile` will automatically search for the first file it finds in this exact priority order:

1. `config.smile.json`
2. `smile.config.json`
3. `.smilerc.json`
4. `smile.json`

Alternatively, you can run `npx @mrjacket/smile init` to generate a configuration file automatically.

## Configuration Format

The configuration file must be valid JSON containing a `"rules"` object. 

```json
{
  "rules": {
    "missing-operation-id": "warn",
    "missing-summary": "off"
  }
}
```

### Severities

You can set any valid rule to one of three severities:
- **`"error"`**: Fails the build (Exit Code 1). This is the default for all rules if a config file is not present.
- **`"warn"`**: Prints a yellow `🟡` warning in the terminal but allows the build to pass (Exit Code 0).
- **`"off"`**: Completely suppresses the rule and hides it from the report.

## Advanced Options

```json
{
  "testHeaders": {
    "Authorization": "Bearer xxxxx",
    "X-Api-Key": "12345"
  },
  "webhooks": [
    "https://hookSlackazo/services/blablabla"
  ],
  "format": "json",
  "rules": {
    "openapi": {
      "missing-summary": "error"
    }
  }
}
```

### `testHeaders` (optional)
A key-value map of HTTP headers that will be automatically injected into every request made by the Breaching Detector (`smile test`). This saves you from having to type `-H "Authorization: ..."` in the CLI every time. Note that headers passed via the CLI will override these configuration headers.

### `webhooks` (optional)
An array of webhook URLs (e.g. Slack, Discord, MS Teams). If `smile lint` or `smile test` detects a violation, it will automatically send a POST request to these URLs with a JSON summary of the failure.

### `format` (optional)
Forces the output format globally. Can be `"text"` (default), `"json"`, `"markdown"`, or `"junit"`. Setting this to `"json"` is equivalent to always passing `--format json` via the CLI.

---

## Inline Suppressions (YAML Only)
If you need to bypass a rule on a single specific line without changing the global configuration, you can use the `# smile-ignore-next-line <ruleId>` comment directly in your `.yaml` or `.yml` specifications.

```yaml
paths:
  /users:
    get:
      # smile-ignore-next-line missing-summary
      operationId: getUsers
```

This functions exactly like ESLint or Prettier overrides.

---

## The Rule Matrix

If you have 0 errors but 3 warnings, `smile` will print the warnings natively, print the Smile Signature, and successfully exit with `0`.

---

## Available Rules

Here is the complete list of rule IDs you can override, broken down by format:

### OpenAPI
- `missing-summary`
- `missing-operation-id`
- `untyped-schema-property`

### AsyncAPI
- `missing-channel-description`
- `missing-message-description`
- `untyped-schema-property`

### GraphQL
- `missing-type-description`
- `missing-field-description`
- `deprecated-without-reason`
- `missing-enum-value-description`

### JSON Schema
- `missing-title`
- `missing-description`
- `untyped-property`
- `array-without-items`

### gRPC
- `require-rpc-comments`
- `pascal-case-messages`
- `camel-case-fields`

### Postman
- `require-request-description`
- `require-response-example`
- `no-empty-folders`
