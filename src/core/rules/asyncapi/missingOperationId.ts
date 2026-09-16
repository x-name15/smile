import { ESpecFormat, ESeverity, type IViolation, type ISmileRule } from "../../../models/index.js";

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
export const ruleAsyncApiMissingOperationId: ISmileRule = {
  meta: {
    id: "missing-operation-id",
    title: "Missing Async Operation ID",
    description: "Requires asynchronous pub/sub operations to declare an operationId.",
    format: ESpecFormat.AsyncApi,
    defaultSeverity: "error",
    isFixable: true,
  },
  run(doc): IViolation[] {
    const { asyncapi, channels, operations } = doc as TAsyncApiDoc;
    const violations: IViolation[] = [];
    const isV3 = Boolean(asyncapi && String(asyncapi).startsWith("3")) || Boolean(operations);

    if (isV3) {
      const ops = operations ?? {};
      const opEntries = Object.entries(ops);

      if (opEntries.length === 0 && Object.keys(channels ?? {}).length > 0) {
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

    const channelMap = channels ?? {};

    for (const [channelName, channelItem] of Object.entries(channelMap)) {
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
  },
};