import { type ISmileRule } from "../../../models/index.js";
import { ruleAsyncApiMissingOperationId } from "./missingOperationId.js";
import { ruleAsyncApiMissingMessage } from "./missingMessage.js";
import { ruleAsyncApiUntypedSchemaProperty } from "./untypedSchemaProperty.js";
import {
  ruleAsyncApiMissingChannelDescription,
  ruleAsyncApiMissingMessageDescription,
} from "./missingDescriptions.js";
import { ruleAsyncApiRequireMessageHeaders } from "./require-message-headers.js";
import { ruleAsyncApiRequireCorrelationId } from "./require-correlation-id.js";

/**
 * All active AsyncAPI lint rules. Add new rules here to wire them in.
 */
export const asyncApiRules: ISmileRule[] = [
  ruleAsyncApiMissingOperationId,
  ruleAsyncApiMissingMessage,
  ruleAsyncApiMissingChannelDescription,
  ruleAsyncApiMissingMessageDescription,
  ruleAsyncApiUntypedSchemaProperty,
  ruleAsyncApiRequireMessageHeaders,
  ruleAsyncApiRequireCorrelationId,
];