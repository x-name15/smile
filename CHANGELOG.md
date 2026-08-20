# Changelog

All notable changes to this project will be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.5.3] - 2026-08-20 — Runtime and CI/CD Stability

### Fixed
- **gRPC directory discovery:** `smile lint <directory>` now discovers `.proto` files instead of silently skipping them.
- **OpenAPI path parameters:** Runtime tests now combine parameters declared on a Path Item with operation parameters. Operation-level declarations take precedence.
- **OpenAPI response bodies:** Runtime validation now reads JSON and non-JSON responses according to their `Content-Type`, including `text/plain` schemas.
- **Postman absolute URLs:** Runtime tests preserve absolute request URLs instead of prefixing them with the supplied `baseUrl`.
- **Plugin isolation:** Plugin results are cached per plugin configuration, so one lint/test invocation cannot leak rules into another configuration in the same process.
- **GraphQL custom roots:** Runtime tests now discover query fields when the schema maps `query` to a custom root type instead of requiring a type named `Query`.
- **JUnit output:** XML attributes and failure text are escaped so paths, URLs, rule IDs, and messages containing characters such as `&` or `<` produce valid CI reports.

### Tests
- Added regression coverage for gRPC directory discovery, OpenAPI path-level parameters and text responses, Postman absolute URLs, GraphQL custom query roots, plugin isolation, and JUnit escaping.
- The release candidate passes 104 tests, strict TypeScript checking, and the production build.

### Changed
- **Repository quality gate:** Removed the unused `npm run lint` script. For this contract-validation project, CI relies on strict typechecking, regression tests, and production builds rather than a separate source-style lint step.
- **Documentation parity:** Updated the README and `docs/` guides to describe the current OpenAPI, GraphQL, gRPC, Postman, runtime, and CI/CD behavior accurately.

## [1.5.2] - 2026-07-31 — More Commands and Support Update

### Added
- **`smile config` command:** Added a sleek new CLI command that visually summarizes all active rule overrides and plugins based on your `config.smile.json`.
- **OpenAPI Phantom Parameters:** Added the `valid-path-parameters` rule. If you define a route like `/users/{id}`, this rule strictly enforces that the parameter `id` is explicitly documented, preventing unvalidated inputs and broken SDK generation.
- **GraphQL Auto-Fixer:** Upgraded `smile deduce` to fully support GraphQL naming conventions. It now automatically detects `camel-case-fields` and `pascal-case-types` violations, suggests the correct casing, and safely injects the fix via regex AST manipulation to perfectly preserve your comments.

### Fixed
- **Documentation Parity:** Fixed missing rules in the `configuration.md` master list and corrected malformed markdown codeblocks in the GraphQL rules documentation to ensure 1:1 parity between code and docs.

---

## [1.5.1] - 2026-07-31 — JSON Schema Strictness & AsyncAPI Deduce

### Added
- **JSON Schema Strictness:** Added `require-additional-properties` rule. This strictly enforces that all `type: "object"` schemas explicitly declare `"additionalProperties": false` to prevent loose payloads and mass assignment vulnerabilities.
- **AsyncAPI Deduce Support:** The `smile deduce` interactive auto-fixer now fully supports AsyncAPI! It can now interactively fix `missing-operation-id` and `missing-channel-description` violations in your event streams, injecting the code via a generic AST parser to preserve all YAML formatting and `# comments` perfectly.

---

## [1.5.0] - 2026-07-31 — JSON:API & HAL Validation

### Added
- **JSON:API & HAL Strict Contract Linting:** Added `strict-hypermedia` OpenAPI rule. If an endpoint declares a response with `application/vnd.api+json` or `application/hal+json`, `smile` statically traverses the schema to enforce the hypermedia standard (e.g. JSON:API requires `data`, `meta`, or `errors`; HAL requires `_links`).
- **JSON:API & HAL Dynamic Runtime Validation:** The Breaching Detector (`smile test`) is now hypermedia-aware. When it intercepts a live response with `application/vnd.api+json` or `application/hal+json` headers, it dynamically asserts that the payload conforms to the official structural constraints, completely independent of the user's OpenAPI schema.
- **Zero Configuration (Automatic Opt-in):** Hypermedia validation is 100% plug-and-play. It only activates if you explicitly declare or serve those content types, maintaining perfect backwards compatibility for standard REST/JSON APIs.

### Docs
- **Documentation Parity:** Ensured `docs/` is 1:1 with `src/`. Added `strict-hypermedia` to `docs/rules/openapi.md`.
- **Configuration Hub:** Updated `docs/configuration.md` with the new rule, missing 1.4.3 rules, and added documentation for the `plugins` array.
- **Smart Validation Details:** Documented the "Zero Config" nature of hypermedia validation in both `docs/rules/openapi.md` and `docs/getting-started.md`.

---

## [1.4.6] - 2026-07-31 — Security Policy & CodeQL Configuration

### Security & Documentation
- **Fix:** Properly resolved "Missing regular expression anchor" in `detectSpecFormat.ts` by structurally extracting the Postman schema URL first and validating it with a strict `^` anchor, avoiding previous hacky workarounds.
- **Fix:** Refactored the `no-acme-domain` rule example in `my-custom-plugin.js` to use `.includes()` instead of a regex, resolving a CodeQL false positive without altering the business intent.
- **Added:** Created `SECURITY.md` to officially establish the security policy and document known CodeQL false positives.
- **Added:** Introduced `.github/config/codeql/codeql-config.yml` to formally suppress the `js/file-access-to-http` CodeQL rule. This rule is a false positive since the core functionality of the `smile test` command (Breaching Detector) fundamentally requires sending local file data over HTTP to validate target APIs.

---

## [1.4.5] - 2026-07-31 — Security Hardening

### Security
- **Fix:** Resolved 19 CodeQL vulnerabilities across the codebase.
- **Fix:** Hardened Postman and Custom Plugin parsers against Incomplete URL Substring Sanitization (CWE-20) by strictly validating hostnames and using word boundaries.
- **Fix:** Eliminated Time-of-Check to Time-of-Use (TOCTOU) file system race conditions in `smile init` and `smile install-hook` commands by using atomic exclusive writes (`wx`).
- **Fix:** Added missing regex anchors to prevent potential ReDoS attacks during spec format detection.
- **Fix:** Suppressed SSRF/Data Exfiltration false positives in the Breaching Detector by properly sanitizing requested URLs with the `URL` constructor.

---

## [1.4.4] - 2026-07-30 — GraphQL Naming Conventions

### Added
- **New GraphQL Rule: `require-pascal-case-types`**: Added strict naming convention rule for GraphQL types (Object, Input, Interface, Enum, Union) to require PascalCase.
- **New GraphQL Rule: `require-camel-case-fields`**: Added strict naming convention rule for GraphQL fields to require camelCase.

### Chore
- **CI/CD Hardening**: Added `semantic-pr.yml` to strictly enforce conventional commits on all Pull Requests.
- **Security Scanning**: Added `codeql.yml` to automatically run GitHub CodeQL SAST scans on every push to main and weekly schedules.

---

## [1.4.3] - 2026-07-30 — GraphQL Runtime Validation & OpenAPI Hardening

### Added
- **GraphQL Runtime Validation:** Extends the Breaching Detector (`smile test`) to natively support GraphQL schemas. It parses `.graphql` SDL files, automatically generates shallow queries (using `__typename`) for parameter-less endpoints on the `Query` root type, dispatches them via POST, and verifies the response structure is free of GraphQL errors.
- **New OpenAPI Rule: `valid-examples`**: Added strict static validation for OpenAPI examples. If you declare a schema property (e.g., `type: integer`) and provide an example that violates it (e.g., `example: "foo"`), `smile` will now block the build.
- **New OpenAPI Rule: `require-security`**: Added strict static validation enforcing that every endpoint either has a `security` requirement defined globally/locally, or explicitly overrides it to public using `security: []`. Prevents accidental exposure of unprotected APIs.
- **New OpenAPI Rule: `no-http-verbs-in-path`**: Added a REST best-practice rule that triggers warnings if paths contain verbs (e.g., `/getUsers`, `/createOrder`).

### Chore
- **Dependabot Configuration**: Added `.github/dependabot.yml` for automated dependency updates on a weekly schedule.

---

## [1.4.2] - 2026-07-30 — Full Breaching Detector & Postman Runtime Validation

### Added
- **OpenAPI `POST/PUT/PATCH/DELETE` Validation:** The Breaching Detector (`smile test`) now supports state-mutating requests. It automatically generates valid JSON bodies for `POST/PUT/PATCH` requests by analyzing the OpenAPI schema.
- **Postman Runtime Validation:** The Breaching Detector can now recursively traverse Postman collections, fire requests against the live server, and dynamically infer a structural JSON Schema from the saved example to validate the real server's response.
- **Runtime Dispatcher Architecture:** Refactored `smokeTest.ts` into a clean format-based dispatcher that delegates to `openapiTester.ts` and `postmanTester.ts`.

### Changed
- **Warning Toleration:** `smile test` now properly ignores warnings (such as `204 No Content` missing a schema) and correctly exits with code `0` as long as there are no Error-level violations.

### Docs
- **Destructive Warnings:** Added prominent warnings to `README.md`, `docs/getting-started.md`, and `docs/library.md` explicitly stating that `smile test` now modifies databases with fake data.
- **Roadmap:** Updated roadmap, pushing AsyncAPI broker validation to v1.6.0.

---

## [1.4.1] - 2026-07-30 — Hardening & Stability

### Fixed
- **detectSpecFormat fallback:** When a file format cannot be determined, it now returns `ESpecFormat.Unknown` and displays a clear error message, rather than silently falling back to parsing as OpenAPI and generating confusing parser errors.
- **Postman typings:** Replaced all usages of `any[]` in Postman rules with the new `IPostmanItem` interface, ensuring type safety against malformed collection JSONs.
- **Postman interfaces moved:** Moved all Postman type definitions (`IPostmanCollection`, `IPostmanItem`, etc.) to the central `src/models/index.ts` file and added comprehensive TSDocs.
- **Deduce interactive auto-fixer:** Hardened `smile deduce` to abort gracefully if run against unsupported formats (like gRPC, Postman, GraphQL). Added guard checks to prevent crashes when JSON structures lack a `paths` object.

### Tests
- **gRPC stress testing:** Added `sample-grpc-large.proto`, a real-world multi-service fixture with nested types and enums, to ensure `protobufjs` rules scale gracefully.
- **OpenAPI stress testing:** Added `sample-openapi-large.yaml` with 50 endpoints to ensure fast AST generation and linting.

---

## [1.4.0] - 2026-07-30 — gRPC and Postman Support

### Added
- **gRPC (.proto) Linting:** Introduced native static linting for Protocol Buffers using `protobufjs` (new runtime dependency).
- **gRPC Native Rules:** Added `require-rpc-comments`, `pascal-case-messages`, and `camel-case-fields`.
- **Postman Collections Linting:** Introduced native static linting for Postman Collections (`v2.0.0` and `v2.1.0`).
- **Postman Native Rules:** Added `require-request-description`, `no-empty-folders`, and `require-response-example`.
- **New Exported Functions:** `lintGrpcSpec` and `lintPostmanSpec` are now fully exported from the library API.
- **New Fixtures:** Added `fixtures/sample-grpc.proto`, `fixtures/sample-grpc-clean.proto`, `fixtures/sample-postman.json`, and `fixtures/sample-postman-clean.json` for testing.

### Fixed
- **gRPC Parser bug:** `protobufjs` was loaded without `alternateCommentMode: true`, causing all method comments to be silently ignored. The `require-rpc-comments` rule was firing on every method indiscriminately. Fixed by enabling `alternateCommentMode` in `src/parsers/grpc.ts`.
- **Interface inconsistency:** `src/parsers/grpc.ts` and `src/parsers/postman.ts` were returning custom interfaces (`IGrpcParsedResult`, `IPostmanParsedResult`) instead of the standard project interface `IParsedSpec`. Refactored to use the shared interface for consistency.
- **TypeScript type assertion:** Added proper `as protobuf.Root` and `as IPostmanCollection` casts in `src/core/index.ts` after standardizing parsers to `IParsedSpec`, fixing TS2345 errors on build.
- **npm keywords:** Added missing `grpc`, `protobuf`, `postman`, and `graphql` keywords to `package.json`.

### Tests
- **gRPC test suite expanded:** `lintGrpc.test.ts` went from 1 test to 9 tests. Now matches the depth of OpenAPI/AsyncAPI suites: broken spec tests per rule (with specific message assertions), format detection, required fields check, and a full clean-spec passing test.
- **Postman test suite expanded:** `lintPostman.test.ts` went from 1 test to 10 tests. Includes a negative test verifying that a well-formed request (`Get Users`) does NOT trigger false positives.
- **detectSpecFormat tests:** Added coverage for `.proto` and Postman Collection detection.

### Docs
- **New:** `docs/rules/grpc.md` — full rules reference for gRPC in the same style as `openapi.md` (with Triggers on / Clean examples for each rule).
- **New:** `docs/rules/postman.md` — full rules reference for Postman in the same style as `openapi.md`.
- **Updated:** `docs/README.md` — added gRPC and Postman to the Rules Reference table.
- **Updated:** `README.md` — Features list now includes gRPC, Postman, and the Plugin System. Supported formats line now includes `.proto`. Rules Reference links updated. Roadmap updated to remove already-shipped 1.4.0 items.

---

## [1.3.1] - 2026-07-30 — CLI Plugin Flag

### Added
- **CLI Plugin Injection:** Added the `-p, --plugin <path>` flag to the `lint` and `test` CLI commands. You can now load custom rules on the fly directly from the terminal without having to modify `config.smile.json` (e.g., `smile lint ./api.yaml --plugin ./my-plugin.js`).

### Docs
- **CLI Options:** Explicitly listed CLI options (`--format`, `--quiet`, `--plugin`, `--header`) in `docs/getting-started.md`.
- **Documentation Hub:** Completely revamped `docs/README.md` to act as an organized hub linking all new guides (Plugins, Library API, Configuration, CI/CD).

---

## [1.3.0] - 2026-07-30 — The Plugin System

### Added
- **Plugin System:** Enterprise teams can now inject their own JavaScript/TypeScript custom rules dynamically at runtime via `config.smile.json`. 
  - Plugins can be loaded via relative paths (`./my-rules.js`) or NPM packages (`smile-plugin-enterprise`).
  - Custom rules can target specific formats (e.g. `openapi`) or apply universally to all formats using `"all"`.
  - Added new `plugins` array property to the configuration file format.

### Docs
- **Plugin Guide:** Created a dedicated `docs/plugins.md` explaining how to build and inject custom rules.
- **Boilerplate:** Added a ready-to-use boilerplate plugin in `examples/my-custom-plugin.js`.

### Chore
- **Test Fixtures Isolation:** Migrated all internal `.yaml` test files from the `examples/` folder to a dedicated `fixtures/` directory. The `examples/` folder is now strictly reserved for clean, production-ready boilerplate code. Evaluated and refactored the entire `src/core/__tests__` suite to point to the new directory safely.

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
