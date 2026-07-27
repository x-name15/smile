# smile — Documentation

**`@mrjacket/smile`** is a strict API contract validator for OpenAPI, AsyncAPI,
JSON Schema, and GraphQL SDL. It lints your spec and verifies real HTTP
responses against it.

---

## Guides

| Document | Audience | What it covers |
|----------|----------|----------------|
| [Getting Started](./getting-started.md) | Everyone | Install, CLI usage, CI integration |
| [Library API](./library.md) | Developers | Programmatic usage, Vitest/Jest integration, TypeScript types |

## Rules Reference

| Format | Document | Rules |
|--------|----------|-------|
| OpenAPI 3.x | [openapi.md](./rules/openapi.md) | 5 rules |
| AsyncAPI 2.x | [asyncapi.md](./rules/asyncapi.md) | 5 rules |
| JSON Schema | [json-schema.md](./rules/json-schema.md) | 4 rules |
| GraphQL SDL | [graphql.md](./rules/graphql.md) | 4 rules |

## Contributing

See [CONTRIBUTING.md](../.github/CONTRIBUTING.md) for how to add rules,
set up the dev environment, and open a pull request.
