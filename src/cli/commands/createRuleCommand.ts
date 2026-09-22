import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import * as p from "@clack/prompts";

export interface ICreateRuleOptions {
  format?: string;
  lang?: "ts" | "js";
  out?: string;
}

function toCamelCase(str: string): string {
  return str
    .replace(/[-_]([a-z])/g, (_, g) => g.toUpperCase())
    .replace(/^[A-Z]/, g => g.toLowerCase());
}

export async function runCreateRuleCommand(
  ruleIdArg?: string,
  options: ICreateRuleOptions = {}
): Promise<void> {
  p.intro("Smile Custom Rule Scaffolder 🛠️");

  let ruleId = ruleIdArg?.trim();
  if (!ruleId) {
    const input = await p.text({
      message: "What is the identifier for your new rule? (kebab-case)",
      placeholder: "require-team-tag",
      validate(val) {
        if (!val || !val.trim()) return "Rule ID cannot be empty.";
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(val.trim())) {
          return "Rule ID must be kebab-case (e.g. require-team-tag).";
        }
      },
    });

    if (p.isCancel(input)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }
    ruleId = input.trim();
  }

  const format =
    options.format ||
    (await p.select({
      message: "Which specification format does this rule target?",
      options: [
        { value: "openapi", label: "OpenAPI", hint: "REST APIs (v3.0 / v3.1)" },
        { value: "asyncapi", label: "AsyncAPI", hint: "Event-driven APIs (v2 / v3)" },
        { value: "graphql", label: "GraphQL", hint: "Schema SDL (.graphql)" },
        { value: "json-schema", label: "JSON Schema", hint: "Draft-04/07/2020-12" },
        { value: "grpc", label: "gRPC / Protobuf", hint: ".proto files" },
        { value: "postman", label: "Postman", hint: "Postman Collections (v2.1)" },
        { value: "all", label: "All Formats", hint: "Runs across all specifications" },
      ],
      initialValue: "openapi",
    }));

  if (p.isCancel(format)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  const lang =
    options.lang ||
    (await p.select({
      message: "Template language:",
      options: [
        { value: "ts", label: "TypeScript (.ts)" },
        { value: "js", label: "JavaScript / ESM (.mjs)" },
      ],
      initialValue: "ts",
    }));

  if (p.isCancel(lang)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  const ext = lang === "ts" ? "ts" : "mjs";
  const defaultDir = path.resolve(process.cwd(), "rules");
  const targetPath = options.out
    ? path.resolve(process.cwd(), options.out)
    : path.resolve(defaultDir, `${ruleId}.${ext}`);

  const targetDir = path.dirname(targetPath);
  await mkdir(targetDir, { recursive: true });

  const camelId = toCamelCase(ruleId);
  const relativeRelPath = path.relative(process.cwd(), targetPath).replace(/\\/g, "/");

  const templateContent =
    lang === "ts"
      ? `import type { ISmileCustomRule, IViolation } from "@mrjacket/smile";

/**
 * Custom contract rule: ${ruleId}
 */
export const ${camelId}: ISmileCustomRule = {
  format: "${format}",
  evaluate(doc: any): IViolation[] {
    const violations: IViolation[] = [];

    // Example inspection logic:
    // if (!doc.info || !doc.info["x-team"]) {
    //   violations.push({
    //     ruleId: "${ruleId}",
    //     message: "Specification is missing required 'x-team' metadata in info object.",
    //     path: "info.x-team",
    //     severity: "error", // "error" | "warning" | "info"
    //   });
    // }

    return violations;
  },
};

export default {
  rules: {
    "${ruleId}": ${camelId},
  },
};
`
      : `/**
 * Custom contract rule: ${ruleId}
 */
export const ${camelId} = {
  format: "${format}",
  evaluate(doc) {
    const violations = [];

    // Example inspection logic:
    // if (!doc.info || !doc.info["x-team"]) {
    //   violations.push({
    //     ruleId: "${ruleId}",
    //     message: "Specification is missing required 'x-team' metadata in info object.",
    //     path: "info.x-team",
    //     severity: "error",
    //   });
    // }

    return violations;
  },
};

export default {
  rules: {
    "${ruleId}": ${camelId},
  },
};
`;

  try {
    await writeFile(targetPath, templateContent, { encoding: "utf-8", flag: "wx" });
  } catch (error: any) {
    if (error?.code === "EEXIST") {
      p.log.error(
        `File already exists at "${relativeRelPath}". Please choose a different rule identifier or delete the existing file.`
      );
      p.cancel("Operation cancelled.");
      process.exit(1);
    }
    throw error;
  }

  p.log.success(`Generated custom rule at "${relativeRelPath}"`);
  p.note(
    `To activate this rule in your workspace, register it in your config.smile.json:\n\n` +
      `{\n` +
      `  "plugins": [\n` +
      `    "./${relativeRelPath}"\n` +
      `  ]\n` +
      `}\n\n` +
      `Then run 'smile lint .' to see your custom rule in action!`,
    "Next Steps"
  );
  p.outro("Happy API contract guarding! 🛡️");
}
