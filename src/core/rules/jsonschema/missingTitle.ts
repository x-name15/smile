import { ESpecFormat, ESeverity, type IViolation, type ISmileRule } from "../../../models/index.js";

type TJsonSchema = Record<string, unknown>;

/**
 * Flags a root JSON Schema that has no `title`.
 * A schema without a title is hard to document, reference in UI tooling,
 * and display meaningfully in generated forms or API documentation.
 */
export const ruleJsonSchemaMissingTitle: ISmileRule = {
  meta: {
    id: "missing-title",
    title: "Missing Schema Title",
    description: "Requires top-level JSON Schemas to define a meaningful title attribute.",
    format: ESpecFormat.JsonSchema,
    defaultSeverity: "warn",
  },
  run(doc): IViolation[] {
    const schema = doc as TJsonSchema;
    if (schema.title) return [];

    return [
      {
        ruleId: "missing-title",
        severity: ESeverity.Error,
        message: "Root schema has no title",
        path: "(root)",
      },
    ];
  },
};
