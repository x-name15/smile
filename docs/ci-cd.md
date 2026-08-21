# Continuous Integration & Delivery (CI/CD)

`smile` is built from the ground up for automated enterprise pipelines. It natively supports Git Hooks, GitHub Actions annotations, step summaries, and JUnit reports for seamless DevOps integration.

For the 1.5.4 release candidate, the repository quality gate is:

```bash
npm ci
npm run typecheck
npm test
npm run build
npm run test:package
```

The test suite covers the CLI discovery path and the runtime/reporting paths
used by pipelines. `npm run test:package` additionally packs and installs the
real npm artifact in a temporary consumer project, checking both library
imports and CLI behavior. There is no separate source-style lint script; the
relevant quality checks are strict TypeScript checking, behavioral tests,
production build, and packaged-artifact validation.

---

## 1. GitHub Actions (First-Class Support)

`smile` detects when it runs inside a GitHub Actions environment (`$GITHUB_ACTIONS === "true"`) and automatically enhances your workflow.

### Inline Annotations
Instead of forcing developers to dig through raw console logs, `smile` injects native `::error::` and `::warning::` workflow commands. GitHub reads these and attaches the violations as **inline comments directly on the Pull Request code diff**.

### Step Summaries
At the end of a `lint` or `test` run, `smile` automatically generates a beautiful Markdown dashboard and appends it to `$GITHUB_STEP_SUMMARY`. 
When your pipeline finishes, developers will see a rich, visual breakdown of their API contract directly in the GitHub UI.

```yaml
# .github/workflows/smile.yml
name: API Contract Validator

on:
  push:
    branches: ["main"]
  pull_request:
    branches: ["main"]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install dependencies
        run: npm ci

      - name: Lint API specifications
        run: npx @mrjacket/smile lint ./specs/
```

---

## 2. GitLab CI, Jenkins, and SonarQube (JUnit)

Many enterprise dashboards rely on the standard JUnit XML format to display interactive metrics and graphs.
You can use the `--format junit` flag to instruct `smile` to output a raw XML report.

```bash
# Output XML for GitLab CI
npx @mrjacket/smile lint ./openapi.yaml --format junit > test-report.xml

# Output XML for the Breaching Detector
npx @mrjacket/smile test ./openapi.yaml https://api.staging.example.com --format junit > smoke-report.xml
```

To keep your logs completely clean while generating these reports, pair it with the Quiet flag:

```bash
npx @mrjacket/smile lint ./openapi.yaml --format junit --quiet > test-report.xml
```

JUnit output is escaped for XML attributes and failure text, so messages,
paths, and URLs containing `&`, `<`, or quotes remain consumable by GitLab,
Jenkins, and SonarQube.

Runtime requests have a 30-second upper bound. A timeout produces an
`endpoint-timeout` error, allowing a pipeline to fail with a useful reason
instead of hanging indefinitely. Webhook destinations that return `4xx` or
`5xx` are also reported as warnings without blocking the main validation run.

### GitLab CI Example
```yaml
# .gitlab-ci.yml
stages:
  - test

smile_lint:
  stage: test
  image: node:22-alpine
  script:
    - npx @mrjacket/smile lint ./openapi.yaml --format junit > smile-report.xml
  artifacts:
    when: always
    reports:
      junit: smile-report.xml
```

---

## 3. Git Pre-Commit Hooks

The cheapest bugs to fix are the ones that never make it into a commit. `smile` includes a zero-dependency hook installer.

```bash
npx @mrjacket/smile install-hook
```

This will create a lightweight Bash script in `.git/hooks/pre-commit` that runs `smile lint .` every time a developer attempts to commit. If the contract is broken, the commit is aborted immediately.

---

## 4. Automation via Webhooks

You can configure `smile` to ping an external service (like Slack, Discord, or Microsoft Teams) whenever a pipeline fails.

Create a `config.smile.json` in your repository root:

```json
{
  "webhooks": [
    "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX"
  ],
  "rules": {
    "missing-operation-id": "error"
  }
}
```

If `smile lint` or `smile test` detects a violation, it will dispatch a POST request summarizing the "crime scene" to the specified webhook channels.
