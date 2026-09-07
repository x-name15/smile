import { ESeverity, type IViolation } from "../../../models/index.js";

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
export function ruleAsyncApiMissingMessage(doc: TAsyncApiDoc): IViolation[] {
  const violations: IViolation[] = [];
  const isV3 = Boolean(doc.asyncapi && String(doc.asyncapi).startsWith("3")) || Boolean(doc.operations);

  if (isV3 && doc.operations) {
    for (const [opKey, opItem] of Object.entries(doc.operations)) {
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

  const channels = doc.channels ?? {};

  for (const [channelName, channelItem] of Object.entries(channels)) {
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
}