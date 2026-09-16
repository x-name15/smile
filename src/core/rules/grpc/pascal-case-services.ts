import protobuf from "protobufjs";
import { ESpecFormat, ESeverity, type IViolation, type ISmileRule } from "../../../models/index.js";

/**
 * Enforces PascalCase naming conventions on all gRPC service declarations.
 */
export const pascalCaseServices: ISmileRule = {
  meta: {
    id: "pascal-case-services",
    title: "PascalCase Protobuf Services",
    description: "Enforces PascalCase naming on service definitions in .proto specifications.",
    format: ESpecFormat.Grpc,
    defaultSeverity: "error",
  },
  run(doc): IViolation[] {
    const root = doc as protobuf.Root;
    const violations: IViolation[] = [];

    function traverse(obj: protobuf.ReflectionObject) {
      if (obj instanceof protobuf.Service) {
        if (!/^[A-Z][a-zA-Z0-9]*$/.test(obj.name)) {
          violations.push({
            ruleId: "pascal-case-services",
            severity: ESeverity.Error,
            message: `Service "${obj.name}" should be PascalCase.`,
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
