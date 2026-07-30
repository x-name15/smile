import protobuf from "protobufjs";
import { ESeverity, type IViolation } from "../../../models/index.js";

export function pascalCaseMessages(root: protobuf.Root): IViolation[] {
  const violations: IViolation[] = [];

  function traverse(obj: protobuf.ReflectionObject) {
    if (obj instanceof protobuf.Type) {
      // PascalCase regex: Starts with capital letter, only alphanumeric
      if (!/^[A-Z][a-zA-Z0-9]*$/.test(obj.name)) {
        violations.push({
          ruleId: "pascal-case-messages",
          severity: ESeverity.Error,
          message: `Message "${obj.name}" should be PascalCase.`,
          path: `Message.${obj.name}`,
        });
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
}
