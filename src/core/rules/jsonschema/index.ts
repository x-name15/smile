import type { ISmileRule } from "../../../models/index.js";
import { ruleJsonSchemaMissingTitle } from "./missingTitle.js";
import { ruleJsonSchemaUntypedProperty } from "./untypedProperty.js";
import { ruleJsonSchemaMissingDescription } from "./missingDescription.js";
import { ruleJsonSchemaArrayWithoutItems } from "./arrayWithoutItems.js";
import { ruleJsonSchemaRequireAdditionalProperties } from "./requireAdditionalProperties.js";

/**
 * All active JSON Schema lint rules. Add new rules here to wire them in.
 */
export const jsonSchemaRules: ISmileRule[] = [
  ruleJsonSchemaMissingTitle,
  ruleJsonSchemaMissingDescription,
  ruleJsonSchemaUntypedProperty,
  ruleJsonSchemaArrayWithoutItems,
  ruleJsonSchemaRequireAdditionalProperties,
];
