/**
 * @fileoverview Main entry point for the \`smile\` CLI.
 * 
 * This file registers all available commands using Commander.js and maps them
 * to their respective core functions (linting, smoke testing, bundling, and init).
 * It acts purely as a routing layer, handling standard input/output and exit codes.
 */
import { Command } from "commander";
import { lintSpec, runSmokeTest } from "../core/index.js";
import { renderSmileReport, renderSmileTestReport } from "../reporters/smileReporter.js";
import { VERSION } from "../version.js";

const program = new Command();

program
  .name("smile")
  .description("Strict API contract validator for OpenAPI, AsyncAPI, JSON Schema, and GraphQL")
  .version(VERSION);

program
  .command("lint <specPath>")
  .description("Statically lint a spec file — auto-detects OpenAPI, AsyncAPI, JSON Schema, or GraphQL")
  .action(async (specPath: string) => {
    try {
      const { loadConfig } = await import("../core/index.js");
      const config = loadConfig();
      const result = await lintSpec(specPath, config);
      console.log(renderSmileReport(result));
      process.exitCode = result.passed ? 0 : 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Failed to lint spec: ${message}`);
      process.exitCode = 1;
    }
  });

program
  .command("test <specPath> <baseUrl>")
  .description(
    "Run the Breaching Detector: call every documented GET endpoint against baseUrl and validate real responses against the spec",
  )
  .option(
    "-H, --header <header...>",
    "Custom HTTP headers to inject into the requests (e.g., -H 'Authorization: Bearer token')",
  )
  .action(async (specPath: string, baseUrl: string, options: { header?: string[] }) => {
    try {
      const headersRecord: Record<string, string> = {};
      if (options.header) {
        for (const h of options.header) {
          const firstColon = h.indexOf(":");
          if (firstColon === -1) {
            console.warn(`⚠️ Warning: Invalid header format "${h}". Expected "Key: Value".`);
            continue;
          }
          const key = h.slice(0, firstColon).trim();
          const value = h.slice(firstColon + 1).trim();
          headersRecord[key] = value;
        }
      }

      const result = await runSmokeTest(specPath, baseUrl, headersRecord);
      console.log(renderSmileTestReport(result));
      process.exitCode = result.passed ? 0 : 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Failed to run smoke test: ${message}`);
      process.exitCode = 1;
    }
  });

program
  .command("bundle <specPath>")
  .description(
    "Bundle a multi-file spec (OpenAPI, AsyncAPI, JSON Schema) into a single, resolved JSON file.",
  )
  .option("-o, --out <outputPath>", "Output file path. If not provided, prints to stdout.")
  .action(async (specPath: string, options: { out?: string }) => {
    try {
      // Import here so we don't add overhead to other commands
      const { bundleSpec } = await import("../core/index.js");
      const { writeFileSync } = await import("node:fs");
      
      const result = await bundleSpec(specPath);

      if (result.skipped) {
        console.log(`\nℹ️  ${result.message}\n`);
        return;
      }

      const jsonStr = JSON.stringify(result.bundledData, null, 2);

      if (options.out) {
        writeFileSync(options.out, jsonStr, "utf-8");
        console.log(`\n✅ Bundled spec successfully saved to ${options.out}\n`);
      } else {
        console.log(jsonStr);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`\nFailed to bundle spec: ${message}\n`);
      process.exitCode = 1;
    }
  });

program
  .command("init")
  .description("Initialize smile in your project (generates config, CI workflow, and sample API)")
  .action(async () => {
    try {
      const { runInitCommand } = await import("./initCommand.js");
      await runInitCommand();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Failed to initialize smile: ${message}`);
      process.exitCode = 1;
    }
  });

program.parse(process.argv);