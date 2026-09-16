import protobuf from "protobufjs";
import { ESpecFormat, ESeverity, type IViolation, type ISmileRule } from "../../../models/index.js";

export const requireRpcComments: ISmileRule = {
  meta: {
    id: "require-rpc-comments",
    title: "Documented RPC Methods",
    description: "Requires all protobuf service RPC definitions to have documentation comments.",
    format: ESpecFormat.Grpc,
    defaultSeverity: "error",
  },
  run(doc): IViolation[] {
    const root = doc as protobuf.Root;
    const violations: IViolation[] = [];

    function traverse(obj: protobuf.ReflectionObject) {
      if (obj instanceof protobuf.Service) {
        for (const [methodName, method] of Object.entries(obj.methods)) {
          if (!method.comment || method.comment.trim() === "") {
            violations.push({
              ruleId: "require-rpc-comments",
              severity: ESeverity.Error,
              message: `RPC method "${methodName}" in service "${obj.name}" is missing a comment/description.`,
              path: `Service.${obj.name}.${methodName}`,
            });
          }
        }
      }
      
      // Traverse nested objects (Namespaces, Services, etc.)
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
