import { ESeverity, type IViolation } from "../../../models/index.js";

type TJsonSchema = Record<string, unknown>;

/**
 * Flags a root JSON Schema that has no `title`.
 * A schema without a title is hard to document, reference in UI tooling,
 * and display meaningfully in generated forms or API documentation.
 */
export function ruleJsonSchemaMissingTitle(doc: TJsonSchema): IViolation[] {
  if (doc.title) return [];

  return [
    {
      ruleId: "missing-title",
      severity: ESeverity.Error,
      message: "Root schema has no title",
      path: "(root)",
    },
  ];
}
