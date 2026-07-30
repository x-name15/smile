# Writing and Using Custom Plugins

The **Plugin System** (introduced in v1.3.0) transforms `smile` from a standard linter into a highly extensible ecosystem. It allows enterprise teams to define custom rules in JavaScript or TypeScript and inject them seamlessly into the linting pipeline.

---

## 1. Using a Plugin

Plugins can be loaded either from a local file path or from an external NPM package. 
To enable a plugin, add its path to the `plugins` array in your `config.smile.json`, and configure the rule's severity.

```json
{
  "plugins": [
    "./scripts/smile-custom-rules.js",
    "smile-plugin-enterprise-standards"
  ],
  "rules": {
    "my-company-internal-rule": "error",
    "enterprise-no-http": "warn"
  }
}
```

- **Local paths** (`./...` or `/...`) are resolved against the directory where you run the CLI.
- **NPM packages** are resolved directly from your `node_modules`.

---

## 2. Writing a Plugin

A plugin is simply a Node.js module that exports a `rules` object. 

You can write plugins using **ES Modules** (`export default`) or **CommonJS** (`module.exports`).

### Example: A basic local plugin (ESM)
You can find a complete, ready-to-use boilerplate in the [`examples/my-custom-plugin.js`](../examples/my-custom-plugin.js) file of this repository.

To build it yourself, create a file `smile-rules.mjs` in your repository:

```javascript
// smile-rules.mjs
export default {
  rules: {
    "require-v1-prefix": {
      // "openapi", "asyncapi", "json-schema", "graphql", or "all"
      format: "openapi",
      
      evaluate(doc) {
        const violations = [];
        const paths = doc.paths || {};

        for (const pathKey of Object.keys(paths)) {
          if (!pathKey.startsWith("/v1/")) {
            violations.push({
              severity: "error", // Can be "error", "warning", or "info"
              message: `All endpoints must start with /v1/. Found: ${pathKey}`,
              path: `paths.${pathKey}`
            });
          }
        }

        return violations; // Return an empty array if there are no violations
      }
    }
  }
};
```

Update your config:
```json
{
  "plugins": ["./smile-rules.mjs"],
  "rules": {
    "require-v1-prefix": "error"
  }
}
```

Now, when you run `smile lint ./api.yaml`, your custom rule will be evaluated exactly like a native `smile` rule. If it fails, it will perfectly integrate into the GitHub Actions Step Summaries, JUnit reports, and terminal output.

---

## 3. Plugin API Reference

### The Plugin Object
A plugin must export an object containing a `rules` property.

```typescript
interface ISmilePlugin {
  rules: Record<string, ISmileCustomRule>;
}
```

### The Custom Rule Object
Each rule definition requires two properties: `format` and `evaluate`.

```typescript
interface ISmileCustomRule {
  // The spec format this rule applies to. Use "all" if it's format-agnostic.
  format: "openapi" | "asyncapi" | "json-schema" | "graphql" | "all";
  
  // The function that performs the validation.
  // It receives the raw AST object (doc) of the parsed spec file.
  evaluate: (doc: any) => IViolation[];
}
```

### The Violation Object
If your rule detects an issue, it should return one or more `IViolation` objects.

```typescript
interface IViolation {
  // You do not need to provide a ruleId; the engine automatically injects the 
  // rule's dictionary key (e.g., "require-v1-prefix").
  
  severity: "error" | "warning" | "info";
  message: string;
  path: string; // A dot-notation string indicating where the error occurred (e.g. "info.title")
}
```

---

## 4. Universal Compatibility (CLI, CI/CD, & Library API)

The plugin architecture is integrated directly into the core engine (`lintSpec`), which means it works identically across all environments:

1. **CLI Usage:** When you run `smile lint .`, it automatically reads `plugins` from `config.smile.json` and evaluates them. You can also load plugins on the fly (bypassing or adding to the config file) using the `--plugin` flag:
   ```bash
   smile lint ./api.yaml --plugin ./smile-rules.mjs
   ```
2. **CI/CD Pipelines:** In GitHub Actions, GitLab CI, or pre-commit hooks, plugins run exactly as they do locally. Any violations caught by your custom rules will be automatically translated into GitHub Step Summaries, PR inline annotations, and JUnit XML dashboards just like native rules.
3. **Programmatic Usage (Vitest / Jest):** If you are using `smile` as a library in your integration tests, you can inject plugins directly through the configuration object:

```typescript
import { lintSpec } from "@mrjacket/smile";

const result = await lintSpec("./api.yaml", {
  plugins: ["./my-custom-rules.js"],
  rules: {
    "my-custom-rule": "error"
  }
});
```

---

## 5. Error Handling & Safety

The plugin system is strictly sandboxed inside a `try/catch` block.
If your custom rule code contains a bug or throws a fatal runtime exception, it will **not** crash the CLI or stop your CI pipeline. `smile` will catch the error, print a safe warning to the console, and gracefully continue linting the rest of your API contract.
