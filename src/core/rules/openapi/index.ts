import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import type { IViolation } from "../../../models/index.js";
import { ruleMissingOperationId } from "./missingOperationId.js";
import { ruleMissingResponses } from "./missingResponses.js";
import { ruleUntypedSchemaProperty } from "./untypedSchemaProperty.js";
import { ruleOpenApiMissingSummary } from "./missingSummary.js";
import { ruleOpenApiNo2xxResponse } from "./no2xxResponse.js";

type TOpenApi3Doc = OpenAPIV3.Document | OpenAPIV3_1.Document;
type TRule = (doc: TOpenApi3Doc) => IViolation[];

/**
 * All active OpenAPI lint rules. Add new rules here to wire them in.
 */
export const openApiRules: TRule[] = [
  ruleMissingOperationId,
  ruleMissingResponses,
  ruleUntypedSchemaProperty,
  ruleOpenApiMissingSummary,
  ruleOpenApiNo2xxResponse,
];
