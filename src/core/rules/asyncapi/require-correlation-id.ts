import { ESpecFormat, ESeverity, type IViolation, type ISmileRule } from "../../../models/index.js";

type TAsyncApiDoc = Record<string, unknown>;

/**
 * Requires AsyncAPI messages to specify a correlationId property or an x-correlation-id header.
 */
export const ruleAsyncApiRequireCorrelationId: ISmileRule = {
  meta: {
    id: "require-correlation-id",
    title: "Require Distributed Correlation ID",
    description: "Requires AsyncAPI messages to define a correlationId property or x-correlation-id header for distributed tracing.",
    format: ESpecFormat.AsyncApi,
    defaultSeverity: "warn",
  },
  run(doc): IViolation[] {
    const violations: IViolation[] = [];

    function checkMessage(msg: any, path: string) {
      if (!msg || typeof msg !== "object" || "$ref" in msg) return;

      const hasCorrelationIdObj = Boolean(msg.correlationId);
      let hasHeaderCorrelationId = false;

      if (msg.headers && typeof msg.headers === "object") {
        const props = (msg.headers as any).properties || {};
        hasHeaderCorrelationId = Object.keys(props).some((k) => {
          const lower = k.toLowerCase();
          return (
            lower === "x-correlation-id" ||
            lower === "correlationid" ||
            lower === "correlation_id" ||
            lower === "traceparent"
          );
        });
      }

      if (!hasCorrelationIdObj && !hasHeaderCorrelationId) {
        violations.push({
          ruleId: "require-correlation-id",
          severity: ESeverity.Warning,
          message: `Message "${msg.name || "Unnamed"}" should define a "correlationId" or an "x-correlation-id" header for distributed tracing.`,
          path: `${path}.correlationId`,
        });
      }
    }

    // Check channels in v2 / v3
    const channels = (doc as TAsyncApiDoc).channels as Record<string, any> | undefined;
    if (channels && typeof channels === "object") {
      for (const [channelKey, channelObj] of Object.entries(channels)) {
        if (!channelObj || typeof channelObj !== "object") continue;

        if (channelObj.publish?.message) {
          checkMessage(channelObj.publish.message, `channels.${channelKey}.publish.message`);
        }
        if (channelObj.subscribe?.message) {
          checkMessage(channelObj.subscribe.message, `channels.${channelKey}.subscribe.message`);
        }

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
