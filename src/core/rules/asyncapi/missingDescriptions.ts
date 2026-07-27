import { ESeverity, type IViolation } from "../../../models/index.js";

type TAsyncApiDoc = { channels?: Record<string, unknown> };

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
        severity: ESeverity.Warning,
        message: `Channel "${channelName}" has no description`,
        path: `channels.${channelName}.description`,
      });
    }
  }

  return violations;
}

/**
 * Flags any channel operation whose message has no `description`.
 * Message descriptions explain the payload's business context — what
 * event happened and why, not just the shape of the data.
 */
export function ruleAsyncApiMissingMessageDescription(
  doc: TAsyncApiDoc,
): IViolation[] {
  const violations: IViolation[] = [];
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
          severity: ESeverity.Warning,
          message: `Message in "${opKey} ${channelName}" has no description`,
          path: `channels.${channelName}.${opKey}.message.description`,
        });
      }
    }
  }

  return violations;
}
