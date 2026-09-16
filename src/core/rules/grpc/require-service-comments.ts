import protobuf from "protobufjs";
import { ESpecFormat, ESeverity, type IViolation, type ISmileRule } from "../../../models/index.js";

/**
 * Requires all gRPC service declarations to include a documentation comment.
 */
export const requireServiceComments: ISmileRule = {
  meta: {
    id: "require-service-comments",
    title: "Documented Protobuf Services",
    description: "Requires all protobuf service definitions to have documentation comments.",
    format: ESpecFormat.Grpc,
    defaultSeverity: "error",
  },
  run(doc): IViolation[] {
    const root = doc as protobuf.Root;
    const violations: IViolation[] = [];

    function traverse(obj: protobuf.ReflectionObject) {
      if (obj instanceof protobuf.Service) {
        if (!obj.comment || obj.comment.trim() === "") {
          violations.push({
            ruleId: "require-service-comments",
            severity: ESeverity.Error,
            message: `Service "${obj.name}" is missing a comment/description.`,
            path: `Service.${obj.name}`,
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
  },
};
