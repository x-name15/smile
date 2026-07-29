import fs from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";
import * as p from "@clack/prompts";
import {
  GITHUB_WORKFLOW,
  SAMPLE_OPENAPI,
  SAMPLE_ASYNCAPI,
  SAMPLE_GRAPHQL,
  SAMPLE_JSONSCHEMA,
  RULES_BY_FORMAT,
} from "./templates.js";

/**
 * Executes the \`smile init\` CLI command.
 * 
 * This wizard guides the user through setting up their repository by:
 * 1. Generating a smart \`config.smile.json\` tailored to their API formats.
 * 2. Scaffolding a GitHub Actions workflow for CI.
 * 3. Dropping a boilerplate API specification to get started instantly.
 */
export async function runInitCommand(): Promise<void> {
  p.intro("Welcome to Smile ☺ Initialization!");

  // 1. Ask if they want a config file
  const generateConfig = await p.confirm({
    message: "Do you want to create a config.smile.json file?",
    initialValue: true,
  });

  if (p.isCancel(generateConfig)) {
    p.cancel("Initialization cancelled.");
    process.exit(0);
  }

  let selectedFormats: any = [];
  if (generateConfig) {
    selectedFormats = await p.multiselect({
      message: "Which API formats does your project use? (Space to select, Enter to confirm)",
      options: [
        { value: "openapi", label: "OpenAPI", hint: "REST APIs" },
        { value: "asyncapi", label: "AsyncAPI", hint: "Event-driven APIs" },
        { value: "graphql", label: "GraphQL", hint: "GraphQL APIs" },
        { value: "jsonschema", label: "JSON Schema", hint: "Raw JSON validation" },
      ],
      required: true,
    });

    if (p.isCancel(selectedFormats)) {
      p.cancel("Initialization cancelled.");
      process.exit(0);
    }
  }

  // 2. Build the config based on selection
  let configGenerated = false;
  if (generateConfig && Array.isArray(selectedFormats) && selectedFormats.length > 0) {
    const rules: Record<string, Record<string, string>> = {};
    for (const format of selectedFormats) {
      const formatRules = RULES_BY_FORMAT[format as string] || [];
      if (formatRules.length > 0) {
        rules[format as string] = {};
        for (const rule of formatRules) {
          rules[format as string][rule] = "error";
        }
      }
    }

    const configContent = JSON.stringify({ rules }, null, 2);
    const configPath = path.resolve(process.cwd(), "config.smile.json");
    
    if (existsSync(configPath)) {
      p.log.warn(`Skipped: config.smile.json already exists.`);
    } else {
      await fs.writeFile(configPath, configContent, "utf-8");
      const totalRules = Object.values(rules).reduce((acc, curr) => acc + Object.keys(curr).length, 0);
      p.log.success(`Created config.smile.json with ${totalRules} rules across ${Object.keys(rules).length} format(s).`);
      configGenerated = true;
    }
  } else {
    p.log.info("No formats selected. Skipped config.smile.json generation.");
  }

  // 3. GitHub Actions
  const generateCI = await p.confirm({
    message: "Generate a GitHub Actions CI workflow?",
    initialValue: true,
  });

  if (p.isCancel(generateCI)) {
    p.cancel("Initialization cancelled.");
    process.exit(0);
  }

  if (generateCI) {
    const ciDir = path.resolve(process.cwd(), ".github", "workflows");
    const ciPath = path.resolve(ciDir, "smile.yml");
    if (existsSync(ciPath)) {
      p.log.warn(`Skipped: .github/workflows/smile.yml already exists.`);
    } else {
      await fs.mkdir(ciDir, { recursive: true });
      await fs.writeFile(ciPath, GITHUB_WORKFLOW, "utf-8");
      p.log.success("Created .github/workflows/smile.yml");
    }
  }

  // 4. Sample Spec
  const sampleSpec = await p.select({
    message: "Which sample specification would you like to generate?",
    options: [
      { value: "none", label: "None (Skip)" },
      { value: "openapi", label: "OpenAPI" },
      { value: "asyncapi", label: "AsyncAPI" },
      { value: "graphql", label: "GraphQL" },
      { value: "jsonschema", label: "JSON Schema" },
    ],
  });

  if (p.isCancel(sampleSpec)) {
    p.cancel("Initialization cancelled.");
    process.exit(0);
  }

  if (sampleSpec !== "none") {
    let specFileName = "";
    let specContent = "";

    switch (sampleSpec) {
      case "openapi":
        specFileName = "sample-api.yaml";
        specContent = SAMPLE_OPENAPI;
        break;
      case "asyncapi":
        specFileName = "sample-asyncapi.yaml";
        specContent = SAMPLE_ASYNCAPI;
        break;
      case "graphql":
        specFileName = "sample-schema.graphql";
        specContent = SAMPLE_GRAPHQL;
        break;
      case "jsonschema":
        specFileName = "sample-schema.json";
        specContent = SAMPLE_JSONSCHEMA;
        break;
    }

    if (specFileName) {
      const specPath = path.resolve(process.cwd(), specFileName);
      if (existsSync(specPath)) {
        p.log.warn(`Skipped: ${specFileName} already exists.`);
      } else {
        await fs.writeFile(specPath, specContent, "utf-8");
        p.log.success(`Created ${specFileName}`);
      }
    }
  }

  p.outro("Initialization complete! Run 'smile lint <your-spec>' to get started.");
}
