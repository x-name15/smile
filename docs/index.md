# smile — Documentation

**`@mrjacket/smile`** acts as a relentless gatekeeper for your API specifications. 
It auto-detects OpenAPI, AsyncAPI, JSON Schema, and GraphQL SDL, linting the contract 
and verifying real HTTP responses against it to ensure absolute perfection.

---

## Guides

| Document | Audience | What it covers |
|----------|----------|----------------|
| [Getting Started](./getting-started.md) | Everyone | Install, CLI usage, CI integration |
| [Configuration](./configuration.md) | Everyone | Severities, rule priorities, and configuration files |
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
