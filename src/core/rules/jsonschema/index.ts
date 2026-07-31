import type { IViolation } from "../../../models/index.js";
import { ruleJsonSchemaMissingTitle } from "./missingTitle.js";
import { ruleJsonSchemaUntypedProperty } from "./untypedProperty.js";
import { ruleJsonSchemaMissingDescription } from "./missingDescription.js";
import { ruleJsonSchemaArrayWithoutItems } from "./arrayWithoutItems.js";
import { ruleJsonSchemaRequireAdditionalProperties } from "./requireAdditionalProperties.js";

type TJsonSchema = Record<string, unknown>;
type TRule = (doc: TJsonSchema) => IViolation[];

/**
 * All active JSON Schema lint rules. Add new rules here to wire them in.
 */
export const jsonSchemaRules: TRule[] = [
  ruleJsonSchemaMissingTitle,
  ruleJsonSchemaUntypedProperty,
  ruleJsonSchemaMissingDescription,
  ruleJsonSchemaArrayWithoutItems,
  ruleJsonSchemaRequireAdditionalProperties,
];
