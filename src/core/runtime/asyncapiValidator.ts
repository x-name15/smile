/**
 * @fileoverview AsyncAPI runtime validation engine for message payloads.
 * Validates actual broker payloads (Kafka, RabbitMQ, MQTT, etc.) against
 * AsyncAPI 2.x and 3.x channel schema definitions.
 */

import { readFileSync } from "node:fs";
import Ajv from "ajv";
import yaml from "yaml";
import { parseAsyncApiSpec } from "../../parsers/asyncapi.js";
import { ESeverity, type IViolation } from "../../models/index.js";

/**
 * Extracts the payload JSON Schema for a given channel name or address
 * from an AsyncAPI 2.x or 3.x specification.
 */
export function extractAsyncApiPayloadSchema(
  specRaw: Record<string, unknown>,
  channelTarget: string
): { schema?: Record<string, unknown>; error?: string } {
  const channels = (specRaw.channels || {}) as Record<string, Record<string, unknown>>;

  // Try direct key match or address match
  let targetChannelObj: Record<string, unknown> | undefined = channels[channelTarget];

  if (!targetChannelObj) {
    for (const [key, ch] of Object.entries(channels)) {
      if (ch && typeof ch === "object" && (ch.address === channelTarget || key === channelTarget)) {
        targetChannelObj = ch;
        break;
      }
    }
  }

  if (!targetChannelObj) {
    return { error: `Channel "${channelTarget}" not found in AsyncAPI specification.` };
  }

  // AsyncAPI 2.x: channels.<channel>.publish.message.payload OR channels.<channel>.subscribe.message.payload
  const publishOp = targetChannelObj.publish as Record<string, unknown> | undefined;
  const subscribeOp = targetChannelObj.subscribe as Record<string, unknown> | undefined;

  const msg2x = (publishOp?.message || subscribeOp?.message) as Record<string, unknown> | undefined;
  if (msg2x && typeof msg2x === "object" && msg2x.payload && typeof msg2x.payload === "object") {
    return { schema: msg2x.payload as Record<string, unknown> };
  }

  // AsyncAPI 3.x: channels.<channel>.messages.<messageKey>.payload
  const messages3x = targetChannelObj.messages as Record<string, Record<string, unknown>> | undefined;
  if (messages3x && typeof messages3x === "object") {
    for (const msg of Object.values(messages3x)) {
      if (msg && typeof msg === "object" && msg.payload && typeof msg.payload === "object") {
        return { schema: msg.payload as Record<string, unknown> };
      }
    }
  }

  return { error: `No message payload schema documented for channel "${channelTarget}".` };
}

/**
 * Validates a message payload against an AsyncAPI spec for a specific channel.
 *
 * @param specPathOrDoc Path to the AsyncAPI file (YAML/JSON) or parsed document object.
 * @param channelTarget Channel name or address (e.g. "user/signedup" or "userSignedUp").
 * @param messagePayload The actual JSON or object message received from the broker.
 * @returns Array of contract violations found (empty array if valid).
 */
export async function validateAsyncApiMessage(
  specPathOrDoc: string | Record<string, unknown>,
  channelTarget: string,
  messagePayload: unknown
): Promise<IViolation[]> {
  const violations: IViolation[] = [];

  let rawSpec: Record<string, unknown>;

  if (typeof specPathOrDoc === "string") {
    try {
      const parsed = await parseAsyncApiSpec(specPathOrDoc);
      rawSpec = parsed.raw as Record<string, unknown>;
    } catch {
      // Fallback: parse raw YAML/JSON directly
      const content = readFileSync(specPathOrDoc, "utf-8");
      rawSpec = (specPathOrDoc.endsWith(".json") ? JSON.parse(content) : yaml.parse(content)) as Record<string, unknown>;
    }
  } else {
    rawSpec = specPathOrDoc;
  }

  const { schema, error } = extractAsyncApiPayloadSchema(rawSpec, channelTarget);

  if (error || !schema) {
    violations.push({
      ruleId: "missing-asyncapi-message-schema",
      severity: ESeverity.Error,
      message: error || `No payload schema found for channel "${channelTarget}"`,
      path: `channels.${channelTarget}`,
    });
    return violations;
  }

  // Validate payload against schema using Ajv
  const ajv = new Ajv({ strict: false, allErrors: true });
  let validate: ReturnType<typeof ajv.compile>;

  try {
    validate = ajv.compile(schema);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    violations.push({
      ruleId: "invalid-asyncapi-schema",
      severity: ESeverity.Error,
      message: `Failed to compile AsyncAPI payload schema: ${message}`,
      path: `channels.${channelTarget}.payload`,
    });
    return violations;
  }

  const valid = validate(messagePayload);
  if (!valid && validate.errors) {
    for (const err of validate.errors) {
      const propPath = err.instancePath
        ? `channels.${channelTarget}${err.instancePath.replace(/\//g, ".")}`
        : `channels.${channelTarget}.payload`;

      violations.push({
        ruleId: "asyncapi-payload-contract-breach",
        severity: ESeverity.Error,
        message: `Payload does not match contract: ${err.message ?? "validation failed"}${
          err.params ? ` (${JSON.stringify(err.params)})` : ""
        }`,
        path: propPath,
      });
    }
  }

  return violations;
}
