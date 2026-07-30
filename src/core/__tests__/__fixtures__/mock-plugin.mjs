import { ESeverity } from "../../../models/index.js";

/**
 * A mock plugin that exports a single rule that always fails
 * when evaluated against an OpenAPI spec.
 */
export default {
  rules: {
    "my-custom-company-rule": {
      format: "openapi",
      evaluate(doc) {
        if (!doc.info || !doc.info.title || doc.info.title === "bad") {
          return [
            {
              severity: ESeverity.Error,
              message: "Company standard: Spec must have a valid title.",
              path: "info.title"
            }
          ];
        }
        return [];
      }
    },
    "my-custom-all-rule": {
      format: "all",
      evaluate(doc) {
        return [
          {
            severity: ESeverity.Warning,
            message: "Global rule applied to all formats.",
            path: "root"
          }
        ];
      }
    }
  }
};
