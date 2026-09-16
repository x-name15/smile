import { ESpecFormat, ESeverity, type IViolation, type ISmileRule } from "../../../models/index.js";

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
export const ruleAsyncApiMissingChannelDescription: ISmileRule = {
  meta: {
    id: "missing-channel-description",
    title: "Missing Channel Description",
    description: "Requires topics and channels to be documented with a description.",
    format: ESpecFormat.AsyncApi,
    defaultSeverity: "warn",
  },
  run(doc): IViolation[] {
    const { channels } = doc as TAsyncApiDoc;
    const violations: IViolation[] = [];
    const channelMap = channels ?? {};

    for (const [channelName, channelItem] of Object.entries(channelMap)) {
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
  },
};

/**
 * Flags any message that has no `description`.
 * Message descriptions explain the payload's business context — what
 * event happened and why, not just the shape of the data.
 * - In AsyncAPI 2.x: checks `channels.<channel>.<publish|subscribe>.message.description`.
 * - In AsyncAPI 3.x: checks `channels.<channel>.messages.<msg>.description`.
 */
export const ruleAsyncApiMissingMessageDescription: ISmileRule = {
  meta: {
    id: "missing-message-description",
    title: "Missing Message Description",
    description: "Requires message payloads and events to declare descriptive documentation.",
    format: ESpecFormat.AsyncApi,
    defaultSeverity: "warn",
  },
  run(doc): IViolation[] {
    const { asyncapi, channels, operations } = doc as TAsyncApiDoc;
    const violations: IViolation[] = [];
    const isV3 = Boolean(asyncapi && String(asyncapi).startsWith("3")) || Boolean(operations);

    if (isV3 && channels) {
      for (const [channelName, channelItem] of Object.entries(channels)) {
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

    const channelMap = channels ?? {};

    for (const [channelName, channelItem] of Object.entries(channelMap)) {
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
  },
};
