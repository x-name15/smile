import { ESeverity, type IViolation } from "../../../models/index.js";

type TAsyncApiDoc = { channels?: Record<string, unknown> };

const OPERATION_KEYS = ["subscribe", "publish"] as const;

/**
 * Flags any channel operation (publish/subscribe) missing an `operationId`.
 * Same rationale as the OpenAPI equivalent: without it, SDK generation
 * and tracing across consumers/producers becomes guesswork.
 */
export function ruleAsyncApiMissingOperationId(doc: TAsyncApiDoc): IViolation[] {
  const violations: IViolation[] = [];
  const channels = doc.channels ?? {};

  for (const [channelName, channelItem] of Object.entries(channels)) {
    if (!channelItem) continue;

    for (const operationKey of OPERATION_KEYS) {
      const operation = (channelItem as Record<string, unknown>)[
        operationKey
      ] as { operationId?: string } | undefined;

      if (!operation) continue;

      if (!operation.operationId) {
        violations.push({
          ruleId: "missing-operation-id",
          severity: ESeverity.Error,
          message: `Operation "${operationKey} ${channelName}" is missing an operationId`,
          path: `channels.${channelName}.${operationKey}`,
        });
      }
    }
  }

  return violations;
}