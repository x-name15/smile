import Ajv from "ajv";
import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import { ESeverity, type IViolation } from "../../../models/index.js";

type TOpenApi3Doc = OpenAPIV3.Document | OpenAPIV3_1.Document;

export const id = "valid-examples";
export const severity = ESeverity.Error;

const ajv = new Ajv({ strict: false, allErrors: true });

export function run(doc: TOpenApi3Doc): IViolation[] {
  const violations: IViolation[] = [];

  // Helper to validate a schema against its example/default
  const validateSchema = (schema: any, pathLabel: string) => {
    if (!schema || typeof schema !== "object" || schema.$ref) return;

    if (schema.example !== undefined || schema.default !== undefined) {
      const value = schema.example !== undefined ? schema.example : schema.default;
      try {
        const validate = ajv.compile(schema);
        const isValid = validate(value);
        if (!isValid) {
          const errors = (validate.errors ?? []).map(e => `${e.instancePath || "(root)"} ${e.message}`).join(", ");
          violations.push({
            ruleId: id,
            severity,
            message: `Example/default value contradicts its own schema definition: ${errors}`,
            path: pathLabel,
          });
        }
      } catch (err) {
        // Uncompilable schemas are handled by other rules or ignored here
      }
    }

    if (schema.properties) {
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        validateSchema(propSchema, `${pathLabel}.${propName}`);
      }
    }
    if (schema.items) {
      validateSchema(schema.items, `${pathLabel}.items`);
    }
  };

  // Check schemas in components
  const schemas = doc.components?.schemas ?? {};
  for (const [name, schema] of Object.entries(schemas)) {
    validateSchema(schema, `components.schemas.${name}`);
  }

  // Check parameters in components
  const parameters = doc.components?.parameters ?? {};
  for (const [name, param] of Object.entries(parameters)) {
    if ("schema" in param && param.schema) {
      validateSchema(param.schema, `components.parameters.${name}`);
    }
  }

  return violations;
}
