import { ESeverity, type IViolation } from "../../../models/index.js";

type TAsyncApiDoc = {
  asyncapi?: string;
  channels?: Record<string, unknown>;
  operations?: Record<string, unknown>;
};

const OPERATION_KEYS = ["subscribe", "publish"] as const;

/**
 * Flags any operation missing an `operationId`.
 * - In AsyncAPI 2.x: checks channel operations (`channels.<channel>.<publish|subscribe>`).
 * - In AsyncAPI 3.x: checks root operations (`operations.<operation>`).
 */
export function ruleAsyncApiMissingOperationId(doc: TAsyncApiDoc): IViolation[] {
  const violations: IViolation[] = [];
  const isV3 = Boolean(doc.asyncapi && String(doc.asyncapi).startsWith("3")) || Boolean(doc.operations);

  if (isV3) {
    const operations = doc.operations ?? {};
    const opEntries = Object.entries(operations);

    if (opEntries.length === 0 && Object.keys(doc.channels ?? {}).length > 0) {
      violations.push({
        ruleId: "missing-operation-id",
        severity: ESeverity.Error,
        message: "AsyncAPI document defines channels but has no operations declared",
        path: "operations",
      });
      return violations;
    }

    for (const [opKey, opItem] of opEntries) {
      if (!opItem || typeof opItem !== "object") continue;
      const op = opItem as { operationId?: string };
      const effectiveId = (op.operationId || opKey || "").trim();
      if (!effectiveId) {
        violations.push({
          ruleId: "missing-operation-id",
          severity: ESeverity.Error,
          message: `Operation "${opKey}" is missing an operationId`,
          path: `operations.${opKey}`,
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