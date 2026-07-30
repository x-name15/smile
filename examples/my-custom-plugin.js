/**
 * Smile Custom Plugin Example
 * 
 * This is an example of a custom plugin that you can load into smile.
 * To use it, add `"plugins": ["./examples/my-custom-plugin.js"]` 
 * to your config.smile.json
 */

export default {
  rules: {
    "require-v1-prefix": {
      // Apply this rule ONLY to OpenAPI specifications
      format: "openapi",
      evaluate(doc) {
        const violations = [];
        const paths = doc.paths || {};

        for (const pathKey of Object.keys(paths)) {
          if (!pathKey.startsWith("/v1/")) {
            violations.push({
              severity: "error", // Can be "error" or "warning"
              message: `Company Standard: All endpoints must start with /v1/. Found: ${pathKey}`,
              path: `paths.${pathKey}`
            });
          }
        }

        return violations;
      }
    },
    
    "no-acme-domain": {
      // Apply this rule to ALL specification formats (OpenAPI, AsyncAPI, GraphQL, JSON Schema)
      format: "all",
      evaluate(doc) {
        // Stringify the entire AST to do a fast global regex search
        const rawString = JSON.stringify(doc);
        if (rawString.includes("acme.com")) {
          return [
            {
              severity: "warning",
              message: "Company Standard: Do not use 'acme.com' in examples or server blocks.",
              path: "root"
            }
          ];
        }
        return [];
      }
    }
  }
};
