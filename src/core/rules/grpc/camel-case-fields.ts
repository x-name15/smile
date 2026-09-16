import protobuf from "protobufjs";
import { ESpecFormat, ESeverity, type IViolation, type ISmileRule } from "../../../models/index.js";

export const camelCaseFields: ISmileRule = {
  meta: {
    id: "camel-case-fields",
    title: "camelCase Protobuf Fields",
    description: "Enforces camelCase naming on field definitions in protobuf messages.",
    format: ESpecFormat.Grpc,
    defaultSeverity: "error",
  },
  run(doc): IViolation[] {
    const root = doc as protobuf.Root;
    const violations: IViolation[] = [];

    function traverse(obj: protobuf.ReflectionObject) {
      if (obj instanceof protobuf.Type) {
        for (const field of obj.fieldsArray) {
          // camelCase regex: Starts with lowercase letter, only alphanumeric
          if (!/^[a-z][a-zA-Z0-9]*$/.test(field.name)) {
            violations.push({
              ruleId: "camel-case-fields",
              severity: ESeverity.Error,
              message: `Field "${field.name}" in message "${obj.name}" should be camelCase.`,
              path: `Message.${obj.name}.${field.name}`,
            });
          }
        }
      }
      
      if ((obj as any).nestedArray) {
        for (const child of (obj as any).nestedArray) {
          traverse(child);
        }
      }
    }

    traverse(root);
    return violations;
  },
};
