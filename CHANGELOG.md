# Changelog

All notable changes to this project will be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-07-27 — The Stable Release: JSON Schema, GraphQL & Exact Match Docs

### Added
- **v1.0.0 Stable:** `smile` is officially considered stable for production use.
- **Exact CLI Formatting Docs:** Documentation now perfectly mirrors the real CLI output
  (the ASCII art smile and "crime scene" violation formatting).
- **JSON Schema Linting (`lintJsonSchemaSpec`):** Full static analysis for JSON Schema
  documents (`.json` files with a `$schema` key). Three rules active out of the box:
  - `missing-title` — root schema has no `title` field.
  - `untyped-property` — properties without a `type` (mirrors the OpenAPI rule).
  - `missing-description` — properties without a `description` field.
- **GraphQL SDL Linting (`lintGraphQLSpec`):** Full static analysis for GraphQL Schema
  Definition Language files (`.graphql` / `.gql`). Three rules active out of the box:
  - `missing-type-description` — object types, interfaces, enums, and inputs without a
    description block.
  - `missing-field-description` — fields on object types and interfaces without a description.
  - `deprecated-without-reason` — `@deprecated` directives with no `reason` argument.
- **Auto-detection extended:** `detectSpecFormat` and `lintSpec` now transparently handle
  all four formats. `smile lint schema.json` and `smile lint schema.graphql` just work.
- **8 new example files:** `sample-jsonschema.json`, `sample-jsonschema-clean.json`,
  `sample-graphql.graphql`, `sample-graphql-clean.graphql` — used as test fixtures.

### Tests
- Test suite grows from **24 to 45 tests** across 6 files (all passing).
  - `lintJsonSchema.test.ts` — 8 tests covering broken and clean JSON Schema specs.
  - `lintGraphQL.test.ts` — 9 tests covering all 3 GraphQL rules and the clean path.
  - `detectSpecFormat.test.ts` — extended from 4 to 8 tests to cover the new formats.

---

## [0.2.0] - 2026-07-27 — Test Suite, CI/CD & npm Ready

### Added
- **Vitest Test Suite (24 tests across 4 files):** Full coverage of the core engine
  without touching the CLI. Each lint function and the Breaching Detector fully exercised.
- **GitHub Actions CI (`ci.yml`):** Runs `typecheck → build → test → audit` on every
  push and PR to `main`/`develop`.
- **GitHub Actions Publish (`publish.yml`):** Separate workflow that triggers on `v*` tags,
  runs the full build and tests, then publishes to npm with `--provenance` (cryptographic
  link from the package to the exact GitHub commit).
- **`CHANGELOG.md`** — versioned history following Keep a Changelog.
- **`.npmignore`** — explicitly excludes source, dev config, CI files, and examples
  from the published tarball.

### Changed
- **`src/core/rules/` Restructured by Format:** OpenAPI rules moved to `rules/openapi/`,
  mirroring the existing `rules/asyncapi/`. `rules/index.ts` is now a pure barrel.
  Adding a new format = create `rules/<format>/` + one export line.
- **Package renamed** to `@mrjacket/smile` (scoped npm). `package.json` updated with
  `exports`, `repository`, `homepage`, `bugs`, `author`, and `prepublishOnly` hook.
- **Build pipeline split:** `build:js` (tsup) + `build:types` (tsc `--emitDeclarationOnly`)
  to work around a crash in `rollup-plugin-dts` with TypeScript 7.x.
- **`tsconfig.json`** excludes `__tests__/` directories so test `.d.ts` files don't
  bleed into the published package.

### Fixed
- **`src/core/rules/index.ts` Content Corruption:** File had the wrong content — it was
  an old copy of `core/index.ts` with broken import paths. Replaced by the real rule
  registry.
- **`src/cli/index.ts` Duplicate Import:** `runSmokeTest` imported twice and
  `lintOpenApiSpec` imported but unused. Consolidated into a single clean import.
- **`src/parsers/asyncapi.ts` API Version Mismatch:** Was using the `@asyncapi/parser`
  v2.x API (`new Parser()`) while v1.x is installed (`parse()` function).
- **`examples/sample-openapi.yaml` Wrong Format:** Was actually an AsyncAPI document.
  Replaced with a real OpenAPI 3.0 spec with intentional violations on all three rules.
- **Shebang Placement:** `#!/usr/bin/env node` banner was applied to all entry points.
  Now applied only to `dist/cli/index.js`.

---

## [0.1.0] - 2026-07-26 — Foundation

### Added
- **Project Setup (Phase 0):** `src/core/` / `src/cli/` split established as the
  architectural foundation. `tsup` dual entry-point build. Strict TypeScript config.
- **Static OpenAPI Linting (Phase 1):** Extensible rule engine with 3 active rules:
  `missing-operation-id`, `missing-responses`, `untyped-schema-property`.
- **Smile Signature Report (Phase 2):** ASCII art smiley on clean pass. "Crime scene"
  output on violations. CI-friendly exit codes.
- **Breaching Detector (Phase 3):** `runSmokeTest(specPath, baseUrl)` calls every
  documented `GET` endpoint against a live server and validates responses against the
  spec schema. Usable as a library function or via `smile smoke`.
- **AsyncAPI Support (Phase 4):** Static linting with 3 rules: `missing-operation-id`,
  `missing-message`, `untyped-schema-property`. `smile lint` auto-detects format.
