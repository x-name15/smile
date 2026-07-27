import type { IViolation } from "../../../models/index.js";
import { ruleAsyncApiMissingOperationId } from "./missingOperationId.js";
import { ruleAsyncApiMissingMessage } from "./missingMessage.js";
import { ruleAsyncApiUntypedSchemaProperty } from "./untypedSchemaProperty.js";
import {
  ruleAsyncApiMissingChannelDescription,
  ruleAsyncApiMissingMessageDescription,
} from "./missingDescriptions.js";

type TAsyncApiDoc = Record<string, unknown>;
type TRule = (doc: TAsyncApiDoc) => IViolation[];

/**
 * All active AsyncAPI lint rules. Add new rules here to wire them in.
 */
export const asyncApiRules: TRule[] = [
  ruleAsyncApiMissingOperationId,
  ruleAsyncApiMissingMessage,
  ruleAsyncApiUntypedSchemaProperty,
  ruleAsyncApiMissingChannelDescription,
  ruleAsyncApiMissingMessageDescription,
];