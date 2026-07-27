# Contributing to smile

Thank you for considering a contribution to `smile`! Contributions of any kind — bug
reports, feature requests, documentation fixes, and pull requests — are welcome.

`smile` is an open source project licensed under **MIT**, maintained primarily by a
single developer. Please read this document before submitting anything.

## Contact

Questions, design discussions, or ideas: open a
[GitHub Issue](https://github.com/mrjacket/smile/issues) or a Discussion.
For security issues, see [SECURITY.md](SECURITY.md).

---

## Project philosophy

`smile` has two equally important jobs:

- **As a library** — every public function in `src/core/` must be callable directly
  from a test (Jest/Vitest) without spawning a subprocess or touching the CLI.
  No `console.log`, no `process.exit`, no `commander` in core.
- **As a CLI** — `src/cli/` is a thin wrapper over the core. All it does is parse
  arguments, call core functions, and print the result via `src/reporters/`.

Any contribution that blurs this line (e.g. adds CLI logic to core, or moves business
logic into the reporter) will be asked to restructure before merging.

---

## Development workflow

1. Fork the repository and clone it locally.
2. Install dependencies: `npm install`
3. Create a topic branch from `main`:
   ```bash
   git checkout -b feat/json-schema-support
   ```
4. Make your changes.
5. Run the full verification pipeline:
   ```bash
   npm run typecheck
   npm run build
   npm test
   ```
6. Push your branch and open a Pull Request against `main`.

---

## Development setup

### Requirements

- Node.js 18+
- npm 9+

### Useful scripts

| Command | What it does |
|---|---|
| `npm run dev -- lint <spec>` | Run the CLI without building |
| `npm run typecheck` | TypeScript type check (no output = pass) |
| `npm run build` | Build JS bundles + `.d.ts` into `dist/` |
| `npm test` | Run the Vitest test suite |
| `npm run test:watch` | Run Vitest in watch mode (great for TDD) |

---

## Adding a new lint rule

Each format has its own subfolder under `src/core/rules/`:

```
src/core/rules/
  openapi/       ← OpenAPI rules
  asyncapi/      ← AsyncAPI rules
  <newformat>/   ← your new format here
```

To add a rule to an existing format (e.g. OpenAPI):

1. Create `src/core/rules/openapi/yourRuleName.ts` — export one pure function
   `(doc) => IViolation[]`.
2. Import and register it in `src/core/rules/openapi/index.ts`.
3. Add a test case in `src/core/__tests__/lintOpenApi.test.ts`.

To add support for a **new format**:

1. Create `src/parsers/<format>.ts` — expose a `parse<Format>Spec(path)` function.
2. Create `src/core/rules/<format>/index.ts` + at least one rule file.
3. Extend `src/core/detectSpecFormat.ts` to recognize the format.
4. Wire it into `src/core/index.ts` (`lintSpec` dispatcher).
5. Export it from `rules/index.ts`.
6. Add a test file and example specs under `examples/`.

---

## Commit conventions

Follow the team conventions:

- Code, comments, and documentation in **English**.
- Commit messages must be **clear and specific** — not `fix` or `update`.
- Subject line ≤ 72 characters, imperative mood ("Add rule" not "Added rule").
- TypeScript: Hungarian notation for interfaces/enums/types (`IViolation`, `ESeverity`).
- `camelCase` for variables and functions.

**Format:**

```
Add missing-summary rule for OpenAPI operations

Operations without a summary make generated docs unreadable.
This rule flags them at warning severity, not error, since
many existing specs omit them without being technically invalid.
```

---

## Pull Request checklist

Before submitting:

- [ ] `npm run typecheck` passes with no errors
- [ ] `npm run build` succeeds
- [ ] `npm test` passes (all existing tests + any new ones you added)
- [ ] New rules have at least one test covering the violation case and the clean case
- [ ] Commit messages are descriptive and in English

---

Thank you for contributing. Every improvement — even a typo fix — matters.