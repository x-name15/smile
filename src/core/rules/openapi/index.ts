import { type ISmileRule } from "../../../models/index.js";
import { ruleMissingOperationId } from "./missingOperationId.js";
import { ruleMissingResponses } from "./missingResponses.js";
import { ruleUntypedSchemaProperty } from "./untypedSchemaProperty.js";
import { ruleOpenApiMissingSummary } from "./missingSummary.js";
import { ruleOpenApiNo2xxResponse } from "./no2xxResponse.js";
import { ruleValidExamples } from "./valid-examples.js";
import { ruleRequireSecurity } from "./require-security.js";
import { ruleNoHttpVerbsInPath } from "./no-http-verbs-in-path.js";
import { ruleStrictHypermedia } from "./strict-hypermedia.js";
import { ruleOpenApiValidPathParameters } from "./validPathParameters.js";
import { ruleRequireErrorResponses } from "./require-error-responses.js";
import { ruleRequireRateLimiting } from "./require-rate-limiting.js";
import { ruleRequireVersionHeader } from "./require-version-header.js";

/**
 * All active OpenAPI lint rules. Add new rules here to wire them in.
 */
export const openApiRules: ISmileRule[] = [
  ruleOpenApiMissingSummary,
  ruleMissingOperationId,
  ruleMissingResponses,
  ruleOpenApiNo2xxResponse,
  ruleUntypedSchemaProperty,
  ruleValidExamples,
  ruleRequireSecurity,
  ruleNoHttpVerbsInPath,
  ruleStrictHypermedia,
  ruleOpenApiValidPathParameters,
  ruleRequireErrorResponses,
  ruleRequireRateLimiting,
  ruleRequireVersionHeader,
];
