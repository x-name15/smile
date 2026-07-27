import { ESeverity, type IViolation } from "../../../models/index.js";

type TAsyncApiDoc = { channels?: Record<string, unknown> };

const OPERATION_KEYS = ["subscribe", "publish"] as const;

/**
 * Flags any channel operation missing a `message` definition. An event
 * contract that doesn't declare its payload can't be validated against
 * what's actually published or consumed.
 */
export function ruleAsyncApiMissingMessage(doc: TAsyncApiDoc): IViolation[] {
  const violations: IViolation[] = [];
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