import { ESeverity, type IViolation } from "../../../models/index.js";

type TAsyncApiDoc = {
  asyncapi?: string;
  channels?: Record<string, unknown>;
  operations?: Record<string, unknown>;
};

const OPERATION_KEYS = ["subscribe", "publish"] as const;

/**
 * Flags any channel that has no `description`.
 * Channel descriptions explain the business purpose of the event stream —
 * without them, consumers have no context for what the channel represents.
 */
export function ruleAsyncApiMissingChannelDescription(
  doc: TAsyncApiDoc,
): IViolation[] {
  const violations: IViolation[] = [];
  const channels = doc.channels ?? {};

  for (const [channelName, channelItem] of Object.entries(channels)) {
    if (!channelItem) continue;

    const channel = channelItem as { description?: string };

    if (!channel.description?.trim()) {
      violations.push({
        ruleId: "missing-channel-description",
        severity: ESeverity.Error,
        message: `Channel "${channelName}" has no description`,
        path: `channels.${channelName}.description`,
      });
    }
  }

  return violations;
}

/**
 * Flags any message that has no `description`.
 * Message descriptions explain the payload's business context — what
 * event happened and why, not just the shape of the data.
 * - In AsyncAPI 2.x: checks `channels.<channel>.<publish|subscribe>.message.description`.
 * - In AsyncAPI 3.x: checks `channels.<channel>.messages.<msg>.description`.
 */
export function ruleAsyncApiMissingMessageDescription(
  doc: TAsyncApiDoc,
): IViolation[] {
  const violations: IViolation[] = [];
  const isV3 = Boolean(doc.asyncapi && String(doc.asyncapi).startsWith("3")) || Boolean(doc.operations);

  if (isV3 && doc.channels) {
    for (const [channelName, channelItem] of Object.entries(doc.channels)) {
      if (!channelItem || typeof channelItem !== "object") continue;
      const channel = channelItem as { messages?: Record<string, { description?: string }> };
      if (!channel.messages) continue;

      for (const [msgName, msgItem] of Object.entries(channel.messages)) {
        if (!msgItem || typeof msgItem !== "object") continue;
        if (!msgItem.description?.trim()) {
          violations.push({
            ruleId: "missing-message-description",
            severity: ESeverity.Error,
            message: `Message "${msgName}" in channel "${channelName}" has no description`,
            path: `channels.${channelName}.messages.${msgName}.description`,
          });
        }
      }
    }
    return violations;
  }

  const channels = doc.channels ?? {};

  for (const [channelName, channelItem] of Object.entries(channels)) {
    if (!channelItem) continue;

    for (const opKey of OPERATION_KEYS) {
      const operation = (channelItem as Record<string, unknown>)[opKey] as
        | { message?: Record<string, unknown> }
        | undefined;

      if (!operation?.message) continue;

      const message = operation.message as { description?: string };

      if (!message.description?.trim()) {
        violations.push({
          ruleId: "missing-message-description",
          severity: ESeverity.Error,
          message: `Message in "${opKey} ${channelName}" has no description`,
          path: `channels.${channelName}.${opKey}.message.description`,
        });
      }
    }
  }

  return violations;
}
