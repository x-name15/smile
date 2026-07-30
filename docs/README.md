# smile — Documentation

**`@mrjacket/smile`** acts as a relentless gatekeeper for your API specifications. 
It auto-detects OpenAPI, AsyncAPI, JSON Schema, and GraphQL SDL, linting the contract 
and verifying real HTTP responses against it to ensure absolute perfection.

---

## Guides

| Document | Audience | What it covers |
|----------|----------|----------------|
| [Getting Started](./getting-started.md) | Everyone | Install, CLI usage, exit codes, and basic commands. |
| [CI/CD & DevOps](./ci-cd.md) | DevOps & Platform | GitHub Actions Step Summaries, GitLab CI, JUnit XML, Webhooks. |
| [Writing Plugins](./plugins.md) | Enterprise | How to write and inject custom JavaScript/TypeScript rules dynamically. |
| [Configuration](./configuration.md) | Everyone | Severities, rule priorities, webhooks, and `config.smile.json`. |
| [Library API](./library.md) | Developers | Programmatic usage, Vitest/Jest integration, TypeScript types. |

## Rules Reference

| Format | Document | Native Rules |
|--------|----------|-------|
| OpenAPI 3.x | [openapi.md](./rules/openapi.md) | 5 rules |
| AsyncAPI 2.x | [asyncapi.md](./rules/asyncapi.md) | 5 rules |
| JSON Schema | [json-schema.md](./rules/json-schema.md) | 4 rules |
| GraphQL SDL | [graphql.md](./rules/graphql.md) | 4 rules |

## Extensibility

As of `v1.3.0`, `smile` supports **Plugins**. You are no longer restricted to the native rules listed above. You can write custom rules specifically tailored to your company's API guidelines and load them via CLI or configuration files. See the [Writing Plugins](./plugins.md) guide for details.

## Contributing

See [CONTRIBUTING.md](../.github/CONTRIBUTING.md) for how to add rules,
set up the dev environment, and open a pull request.
