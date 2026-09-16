import { ESpecFormat, ESeverity, type IViolation, type ISmileRule } from "../../../models/index.js";

type TAsyncApiDoc = Record<string, unknown>;

/**
 * Requires AsyncAPI messages to define a "headers" schema for transport-level metadata.
 */
export const ruleAsyncApiRequireMessageHeaders: ISmileRule = {
  meta: {
    id: "require-message-headers",
    title: "Require Message Headers Schema",
    description: "Requires AsyncAPI messages to define a headers schema for transport-level metadata.",
    format: ESpecFormat.AsyncApi,
    defaultSeverity: "warn",
  },
  run(doc): IViolation[] {
    const violations: IViolation[] = [];

    function checkMessage(msg: any, path: string) {
      if (!msg || typeof msg !== "object" || "$ref" in msg) return;

      if (!msg.headers || typeof msg.headers !== "object") {
        violations.push({
          ruleId: "require-message-headers",
          severity: ESeverity.Warning,
          message: `Message "${msg.name || "Unnamed"}" should define a "headers" schema for transport metadata.`,
          path: `${path}.headers`,
        });
      }
    }

    // Check channels in v2 / v3
    const channels = (doc as TAsyncApiDoc).channels as Record<string, any> | undefined;
    if (channels && typeof channels === "object") {
      for (const [channelKey, channelObj] of Object.entries(channels)) {
        if (!channelObj || typeof channelObj !== "object") continue;

        // v2 publish / subscribe
        if (channelObj.publish?.message) {
          checkMessage(channelObj.publish.message, `channels.${channelKey}.publish.message`);
        }
        if (channelObj.subscribe?.message) {
          checkMessage(channelObj.subscribe.message, `channels.${channelKey}.subscribe.message`);
        }

        // v3 messages map on channel
        if (channelObj.messages && typeof channelObj.messages === "object") {
          for (const [msgKey, msgObj] of Object.entries(channelObj.messages)) {
            checkMessage(msgObj, `channels.${channelKey}.messages.${msgKey}`);
          }
        }
      }
    }

    // Check components.messages
    const components = (doc as TAsyncApiDoc).components as Record<string, any> | undefined;
    if (components?.messages && typeof components.messages === "object") {
      for (const [msgKey, msgObj] of Object.entries(components.messages)) {
        checkMessage(msgObj, `components.messages.${msgKey}`);
      }
    }

    return violations;
  },
};
