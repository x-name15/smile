import { ESpecFormat, ESeverity, type IViolation, type ISmileRule } from "../../../models/index.js";

type TAsyncApiDoc = {
  asyncapi?: string;
  channels?: Record<string, unknown>;
  operations?: Record<string, unknown>;
  components?: {
    schemas?: Record<string, unknown>;
    messages?: Record<string, unknown>;
  };
};
type TSchemaObject = Record<string, unknown>;

const OPERATION_KEYS = ["subscribe", "publish"] as const;

/**
 * Recursively walks a schema object's properties looking for ones missing
 * a `type` (and without `$ref`, `oneOf`, `anyOf`, or `allOf` as valid
 * alternatives). Mirrors the OpenAPI rule of the same shape.
 */
function findUntypedProperties(
  schema: TSchemaObject,
  basePath: string,
  violations: IViolation[],
): void {
  const properties = schema.properties as
    | Record<string, TSchemaObject>
    | undefined;

  if (!properties) return;

  for (const [propName, propSchema] of Object.entries(properties)) {
    const hasType = Boolean(propSchema.type);
    const hasAlternative = Boolean(
      propSchema.$ref ??
        propSchema.oneOf ??
        propSchema.anyOf ??
        propSchema.allOf,
    );

    if (!hasType && !hasAlternative) {
      violations.push({
        ruleId: "untyped-schema-property",
        severity: ESeverity.Error,
        message: `Property "${propName}" has no declared type`,
        path: `${basePath}.properties.${propName}`,
      });
    }

    if (propSchema.type === "object") {
      findUntypedProperties(
        propSchema,
        `${basePath}.properties.${propName}`,
        violations,
      );
    }
  }
}

/**
 * Flags untyped schema properties across message payloads and reusable components.
 * - In AsyncAPI 2.x: walks `channels.<channel>.<publish|subscribe>.message.payload`.
 * - In AsyncAPI 3.x: walks `channels.<channel>.messages.<msg>.payload`.
 * - Both: walks `components.schemas` and `components.messages`.
 */
export const ruleAsyncApiUntypedSchemaProperty: ISmileRule = {
  meta: {
    id: "untyped-schema-property",
    title: "Untyped Event Property",
    description: "Flags event payload properties that lack explicit schema types.",
    format: ESpecFormat.AsyncApi,
    defaultSeverity: "error",
  },
  run(doc): IViolation[] {
    const { asyncapi, channels, operations, components } = doc as TAsyncApiDoc;
    const violations: IViolation[] = [];
    const isV3 = Boolean(asyncapi && String(asyncapi).startsWith("3")) || Boolean(operations);

    if (isV3 && channels) {
      for (const [channelName, channelItem] of Object.entries(channels)) {
        if (!channelItem || typeof channelItem !== "object") continue;
        const channel = channelItem as { messages?: Record<string, { payload?: TSchemaObject }> };
        if (!channel.messages) continue;

        for (const [msgName, msgItem] of Object.entries(channel.messages)) {
          if (!msgItem?.payload) continue;
          findUntypedProperties(
            msgItem.payload,
            `channels.${channelName}.messages.${msgName}.payload`,
            violations,
          );
        }
      }
    } else {
      const channelMap = channels ?? {};
      for (const [channelName, channelItem] of Object.entries(channelMap)) {
        if (!channelItem) continue;

        for (const operationKey of OPERATION_KEYS) {
          const operation = (channelItem as Record<string, unknown>)[
            operationKey
          ] as { message?: { payload?: TSchemaObject } } | undefined;

          const payload = operation?.message?.payload;
          if (!payload) continue;

          findUntypedProperties(
            payload,
            `channels.${channelName}.${operationKey}.message.payload`,
            violations,
          );
        }
      }
    }

    const schemas = components?.schemas ?? {};
    for (const [schemaName, schema] of Object.entries(schemas)) {
      findUntypedProperties(
        schema as TSchemaObject,
        `components.schemas.${schemaName}`,
        violations,
      );
    }

    const componentMessages = components?.messages ?? {};
    for (const [msgName, msgItem] of Object.entries(componentMessages)) {
      const payload = (msgItem as { payload?: TSchemaObject })?.payload;
      if (payload) {
        findUntypedProperties(
          payload,
          `components.messages.${msgName}.payload`,
          violations,
        );
      }
    }

    return violations;
  },
};