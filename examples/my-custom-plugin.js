/**
 * Smile Custom Plugin Example
 * 
 * This is an example of a custom plugin that you can load into smile.
 * To use it, add `"plugins": ["./examples/my-custom-plugin.js"]` 
 * to your config.smile.json.
 * 
 * Plugins allow you to enforce company-specific API design guidelines
 * using plain JavaScript or TypeScript.
 */

export default {
  rules: {
    /**
     * RULE 1: Format-Specific Rule (OpenAPI only)
     * Enforces that all endpoint paths begin with the `/v1/` versioning prefix.
     */
    "require-v1-prefix": {
      format: "openapi",
      evaluate(doc) {
        const violations = [];
        const paths = doc.paths || {};

        for (const pathKey of Object.keys(paths)) {
          if (!pathKey.startsWith("/v1/")) {
            violations.push({
              severity: "error", // Can be "error" or "warning"
              message: `Company Standard: All endpoints must be versioned. Expected prefix '/v1/', but found: ${pathKey}`,
              path: `paths.${pathKey}`
            });
          }
        }

        return violations;
      }
    },
    
    /**
     * RULE 2: Global Rule (All Formats)
     * Recursively traverses any specification (OpenAPI, AsyncAPI, GraphQL, etc.) 
     * to ensure no 'TODO' or 'FIXME' notes are leaked in the final API contract.
     */
    "no-todo-comments": {
      format: "all",
      evaluate(doc) {
        const violations = [];

        function traverse(node, currentPath) {
          if (typeof node === "string") {
            if (/\b(?:TODO|FIXME)\b/i.test(node)) {
              violations.push({
                severity: "warning",
                message: "Company Standard: Remove TODO/FIXME notes before publishing the API.",
                path: currentPath
              });
            }
          } else if (Array.isArray(node)) {
            node.forEach((item, index) => traverse(item, `${currentPath}[${index}]`));
          } else if (node !== null && typeof node === "object") {
            for (const [key, value] of Object.entries(node)) {
              traverse(value, currentPath === "root" ? key : `${currentPath}.${key}`);
            }
          }
        }

        traverse(doc, "root");
        return violations;
      }
    }
  }
};
