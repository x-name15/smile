import protobuf from "protobufjs";
import { ESpecFormat, ESeverity, type IViolation, type ISmileRule } from "../../../models/index.js";

/**
 * Requires Protocol Buffer specifications to define a package declaration.
 * In protobufjs, packages are structured as plain Namespace instances wrapping
 * the service and message definitions. When no package is declared, types and
 * services reside directly at the root level.
 */
export const requirePackageName: ISmileRule = {
  meta: {
    id: "require-package-name",
    title: "Protobuf Package Declaration",
    description: "Requires all .proto specifications to declare a package name.",
    format: ESpecFormat.Grpc,
    defaultSeverity: "error",
  },
  run(doc): IViolation[] {
    const root = doc as protobuf.Root;
    const violations: IViolation[] = [];

    // If explicit package string was attached to root
    if (typeof (root as any).package === "string" && (root as any).package.trim().length > 0) {
      return violations;
    }

    const nested = root.nestedArray;
    if (!nested || nested.length === 0) {
      violations.push({
        ruleId: "require-package-name",
        severity: ESeverity.Error,
        message: "Protobuf specification is missing a package declaration.",
        path: "package",
      });
      return violations;
    }

    // If any service, message (Type), or enum is defined directly on root, no package was declared
    const hasTopLevelEntities = nested.some(
      (obj) => obj instanceof protobuf.Service || obj instanceof protobuf.Type || obj instanceof protobuf.Enum
    );

    // Must have at least one plain Namespace (not a Type or Service) wrapping definitions
    const hasNamespace = nested.some(
      (obj) => !(obj instanceof protobuf.Service) && !(obj instanceof protobuf.Type) && !(obj instanceof protobuf.Enum) && obj instanceof protobuf.Namespace
    );

    if (hasTopLevelEntities || !hasNamespace) {
      violations.push({
        ruleId: "require-package-name",
        severity: ESeverity.Error,
        message: "Protobuf specification is missing a package declaration.",
        path: "package",
      });
    }

    return violations;
  },
};
