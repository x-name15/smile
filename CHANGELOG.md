# Changelog

All notable changes to this project will be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.5] - 2026-07-30 — CI/CD & Flexibility Patch

### Added
- **GitHub Step Summaries:** `smile lint` and `smile test` now automatically detect if they are running inside GitHub Actions. If so, they will silently append a beautiful Markdown table of the results to `$GITHUB_STEP_SUMMARY`, giving you native visual dashboards on your PRs!
- **Inline Suppressions:** Added support for `# smile-ignore-next-line <ruleId>` in YAML specifications. This allows developers to bypass specific rules on a case-by-case basis using AST parsing without polluting the global `config.smile.json`.
- **JUnit XML Reports:** Added native support for JUnit format (`--format junit`). Both `smile lint` and `smile test` can now output XML reports that are perfectly digestible by GitLab CI, Jenkins, SonarQube, and Bitbucket.
- **Quiet Mode:** Added a `-q, --quiet` flag to suppress all CLI spam (ASCII art, progress spinners, success messages) in CI environments, printing only errors and machine-readable formats.

### Changed
- **Reporters Refactor:** Refactored the internal `smileReporter.ts` into a cleaner, multi-file module architecture without impacting the public API.

### Fixed
- **Documentation Overhaul:** Conducted a massive review of the `docs/` directory to ensure complete parity with the `1.2.5` codebase.
  - Created a dedicated `docs/ci-cd.md` guide centralizing all DevOps capabilities (GitHub Actions, GitLab CI, JUnit, Webhooks, Pre-commit).
  - Fixed outdated references to `smile smoke` across all files, updating them to the correct `smile test` command.
  - Updated `library.md` with accurate TypeScript types for `runSmokeTest` (now returning `ITestResult` and accepting custom HTTP headers).
  - Cleaned up `getting-started.md` and `README.md` to point seamlessly to the new CI/CD guide.
---

## [1.2.4] - 2026-07-29 — Documentation Patch

### Fixed
- **Documentation Sync:** Updated `README.md` and CLI documentation to correctly reflect the new `smile deduce` command name (formerly known as `doctor`) to ensure `npm` displays the correct documentation on the registry.

---

## [1.2.3] - 2026-07-29 — More Developer Experience :D

### Added
- **Smile Deduce:** Added an interactive `smile deduce <spec>` command (The Mentalist auto-fixer!). It reads your specification, finds violations (like missing summaries or operation IDs), and interactively prompts you to fix them right in your terminal. It safely manipulates your YAML files using AST parsing, preserving all `# comments` and formatting!
- **Markdown Reports:** Added `--format markdown` flag for CI/CD integrations. Outputs GitHub-friendly tables that you can pipe directly into Pull Request comments.
- **Pre-commit Hook Installer:** Added the `smile install-hook` command to generate a native, zero-dependency git pre-commit hook that automatically blocks commits if the API contract is broken.
- **Configurable Test Headers:** Added `testHeaders` to `config.smile.json`. You can now store your Bearer tokens or API keys globally instead of typing `-H` repeatedly in `smile test`.

### Changed
- **CLI Architecture Refactor:** Moved all command files (`initCommand`, `hookCommand`, `deduceCommand`) into a dedicated `src/cli/commands/` directory for better maintainability.

### Fixed
- **Init Config Scaffold:** `smile init` now correctly generates stubs for advanced config options (`testHeaders`, `format`, `webhooks`) inside the generated `config.smile.json` so users know they are available.

## [1.2.2] - 2026-07-29 — The Automation Patch

### Added
- **Directory Traversal & `.smileignore`:** You can now run `smile lint .` to automatically discover and lint all specification files in a directory. We added support for `.smileignore` to skip irrelevant files like `node_modules/` or third-party specs.
- **JSON Output (`--format json`):** Added a `-f, --format <type>` flag (which can also be set in `config.smile.json` as `"format": "json"`) to output raw JSON instead of text, making it trivial to integrate `smile` into custom IDE extensions or node scripts.
- **Webhook Alerts:** Added a `"webhooks"` array property to `config.smile.json`. If `smile lint` or `smile test` fails, it automatically fires a POST request summarizing the crime scene to your Slack/Discord channels.
- **Performance Metrics:** The CLI now tracks and prints total execution time (e.g. `Done in 45ms`) at the end of the text report.

---

## [1.2.1] - 2026-07-29 — The Init Patch

### Added
- **Interactive Initializer:** Added the `smile init` CLI command to automatically scaffold projects. Built with `@clack/prompts`, it features a premium, interactive terminal UI. It guides users through creating a `config.smile.json`, a boilerplate `.github/workflows/smile.yml` for CI, and a sample API spec for any of the 4 supported formats (OpenAPI, AsyncAPI, GraphQL, JSON Schema). The config generator is smart and only includes rules for the specific formats the user selects.
- **Nested Configuration Support:** The `config.smile.json` now supports grouping rules by format (e.g., `"openapi": { "missing-summary": "error" }`). This allows you to configure the same rule differently across different formats. The engine remains 100% backwards-compatible with flat configurations.
- **Dedicated Configuration Docs:** Refactored documentation to extract the heavy rules list out of `getting-started.md` and into a clean `configuration.md` guide.

### Changed
- **Internal Documentation:** Added extensive TSDocs to the CLI routing layer (`src/cli/index.ts`) and initialization logic (`src/cli/initCommand.ts`) to improve developer onboarding for future contributors.

---

## [1.2.0] - 2026-07-29 — Enterprise CI/CD & Authentication

### Added
- **Authentication Injection:** The `smile test` command now supports passing custom HTTP headers via the `-H, --header` flag, allowing the Breaching Detector to run against protected APIs that require Bearer tokens or API keys.
- **GitHub Actions Native Annotations:** `smile` now automatically detects when it is running inside GitHub Actions CI/CD. It emits native `::error::` workflow commands, enabling GitHub to automatically attach linting and testing failures as inline comments directly on your Pull Request diffs.
- **Documentation:** Explicitly documented the complete list of available rules for configuration inside `config.smile.json`.

---

## [1.1.2] - 2026-07-27 — CLI Output Accuracy

### Fixed
- **CLI Descriptions:** Updated the CLI `--help` messages to accurately reflect that `smile` supports and auto-detects 4 formats natively: OpenAPI, AsyncAPI, JSON Schema, and GraphQL (previously it only mentioned OpenAPI/AsyncAPI).

---

## [1.1.1] - 2026-07-27 — ESM & Bundler Compatibility

### Fixed
- **Bundlephobia / ESM Support:** Reconfigured `tsup` and `package.json` to publish a dual-format (CommonJS + ESM) library and properly expose `import` and `default` fallbacks in the `"exports"` map. This fixes compatibility issues with modern bundlers (Webpack, esbuild, Vite) and Bundlephobia.

---

## [1.1.0] - 2026-07-27 — Optional Configuration & Strict Engine

### Added
- **Configuration File (`config.smile.json`):** Introduced a flexible configuration system. Users can now place a `config.smile.json`, `smile.config.json`, `.smilerc.json`, or `smile.json` in their project root to override rule severities.
- **Rule Downgrades:** Strict rules can now be downgraded to `warn` (emits a warning but doesn't break CI) or turned `off` completely, enabling incremental adoption for large enterprise projects.
- **Reporter 2.0:** The CLI reporter now displays warnings (`🟡`) natively. If a spec has warnings but zero errors, it successfully prints the Smile Signature and exits with code `0`.

### Changed
- **Strict by Default Engine:** Refactored the core engine so that **all rules** (including all GraphQL rules) emit `Error` by default. `smile` is now mathematically strict out-of-the-box, ensuring zero false-positives on passing builds unless explicitly configured otherwise via the new config file.

---

## [1.0.2] - 2026-07-27 — Dual Registry Publishing & CI Hardening

### Added
- **GitHub Packages Support:** Implemented dual-publishing architecture. `smile` is now officially available on both the global NPM registry (`registry.npmjs.org`) and the GitHub Packages registry (`npm.pkg.github.com`).
- **Enterprise Ready:** This allows enterprise users to consume the library securely via their internal GitHub ecosystems without needing public internet access to NPM.

---

## [1.0.1] - 2026-07-27 — README Badges & Node 22 CI Update

### Changed
- **Node 22 Enforced:** Bumped engines requirement to Node >=22.12.0 for `commander` and `graphql` compatibility.
- **Documentation:** Added official dynamic Shields/Badges (NPM version, downloads, Node, TypeScript, and CI Status) to `README.md`.

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
