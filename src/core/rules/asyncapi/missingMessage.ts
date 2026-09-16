import { ESpecFormat, ESeverity, type IViolation, type ISmileRule } from "../../../models/index.js";

type TAsyncApiDoc = {
  asyncapi?: string;
  channels?: Record<string, unknown>;
  operations?: Record<string, unknown>;
};

const OPERATION_KEYS = ["subscribe", "publish"] as const;

/**
 * Flags any operation missing a `message` or `messages` definition.
 * An event contract that doesn't declare its payload can't be validated.
 * - In AsyncAPI 2.x: checks `channels.<channel>.<publish|subscribe>.message`.
 * - In AsyncAPI 3.x: checks `operations.<operation>.messages`.
 */
export const ruleAsyncApiMissingMessage: ISmileRule = {
  meta: {
    id: "missing-message",
    title: "Missing Channel Message",
    description: "Guarantees channels have an associated message definition.",
    format: ESpecFormat.AsyncApi,
    defaultSeverity: "error",
  },
  run(doc): IViolation[] {
    const { asyncapi, channels, operations } = doc as TAsyncApiDoc;
    const violations: IViolation[] = [];
    const isV3 = Boolean(asyncapi && String(asyncapi).startsWith("3")) || Boolean(operations);

    if (isV3 && operations) {
      for (const [opKey, opItem] of Object.entries(operations)) {
        if (!opItem || typeof opItem !== "object") continue;
        const op = opItem as { messages?: unknown[] };
        if (!op.messages || (Array.isArray(op.messages) && op.messages.length === 0)) {
          violations.push({
            ruleId: "missing-message",
            severity: ESeverity.Error,
            message: `Operation "${opKey}" declares no messages`,
            path: `operations.${opKey}.messages`,
          });
        }
      }
      return violations;
    }

    const channelMap = channels ?? {};

    for (const [channelName, channelItem] of Object.entries(channelMap)) {
      if (!channelItem) continue;

      for (const operationKey of OPERATION_KEYS) {
        const operation = (channelItem as Record<string, unknown>)[
          operationKey
        ] as { message?: unknown } | undefined;

        if (!operation) continue;

        if (!operation.message) {
          violations.push({
            ruleId: "missing-message",
            severity: ESeverity.Error,
            message: `Operation "${operationKey} ${channelName}" declares no message`,
            path: `channels.${channelName}.${operationKey}.message`,
          });
        }
      }
    }

    return violations;
  },
};