/**
 * @fileoverview Main entry point for the \`smile\` CLI.
 * 
 * This file registers all available commands using Commander.js and maps them
 * to their respective core functions (linting, smoke testing, bundling, and init).
 * It acts purely as a routing layer, handling standard input/output and exit codes.
 */
import { Command } from "commander";
import { VERSION } from "../version.js";

const program = new Command();

program
  .name("smile")
  .description("Strict API contract validator for OpenAPI, AsyncAPI, JSON Schema, and GraphQL")
  .version(VERSION);

program
  .command("lint <specPath>")
  .description("Statically lint a spec file or directory — auto-detects OpenAPI, AsyncAPI, JSON Schema, or GraphQL")
  .option("-f, --format <type>", "Output format (text, json, markdown, junit)", "text")
  .option("-p, --plugin <path>", "Load a custom plugin on the fly (overrides config)")
  .option("-q, --quiet", "Quiet mode (suppress text output, only print errors or format reports)", false)
  .action(async (specPath: string, options: { format: string, quiet: boolean, plugin?: string }) => {
    const start = performance.now();
    try {
      const { loadConfig } = await import("../core/index.js");
      const { lintSpec } = await import("../core/index.js");
      const { findSpecFiles, fireWebhooks } = await import("./utils.js");
      const { renderJunitReport, renderMarkdownReport, renderSmileReport } = await import("../reporters/index.js");
      const { emitGithubStepSummary } = await import("../reporters/utils.js");
      
      const config = loadConfig();
      if (options.plugin) {
        config.plugins = [...(config.plugins || []), options.plugin];
      }
      
      let outputFormat = options.format;
      if (config.format && options.format === "text") {
        // Fallback to config if not explicitly overridden by CLI
        outputFormat = config.format;
      }

      const files = findSpecFiles(specPath);
      if (files.length === 0) {
        if (!options.quiet) console.warn(`No specification files found in ${specPath}`);
        process.exitCode = 0;
        return;
      }

      const results = await Promise.all(files.map(f => lintSpec(f, config)));
      const allPassed = results.every(r => r.passed);

      // Always generate step summary in Github Actions if we're running tests
      if (process.env.GITHUB_ACTIONS === "true") {
        const mdSummary = results.map(r => renderMarkdownReport(r)).join("\n---\n");
        emitGithubStepSummary(mdSummary);
      }

      if (outputFormat === "json") {
        console.log(JSON.stringify(results, null, 2));
      } else if (outputFormat === "markdown") {
        for (const result of results) {
          console.log(renderMarkdownReport(result));
        }
      } else if (outputFormat === "junit") {
        for (const result of results) {
          console.log(renderJunitReport(result));
        }
      } else {
        // Aggregate rendering for text
        if (!options.quiet) {
          for (const result of results) {
            console.log(renderSmileReport(result));
          }
          const duration = Math.round(performance.now() - start);
          console.log(`\n⏱️  Done in ${duration}ms`);
        }
      }

      process.exitCode = allPassed ? 0 : 1;

      if (!allPassed) {
        await fireWebhooks(config.webhooks, results.filter(r => !r.passed));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Failed to lint spec: ${message}`);
      process.exitCode = 1;
    }
  });

program
  .command("test <specPath> <baseUrl>")
  .description(
    "Run the Breaching Detector: call supported documented endpoints against baseUrl and validate real responses against the spec",
  )
  .option(
    "-H, --header <header...>",
    "Custom HTTP headers to inject into the requests (e.g., -H 'Authorization: Bearer token')",
  )
  .option("-f, --format <type>", "Output format (text, json, markdown, junit)", "text")
  .option("-p, --plugin <path>", "Load a custom plugin on the fly (overrides config)")
  .option("-q, --quiet", "Quiet mode (suppress text output, only print errors or format reports)", false)
  .action(async (specPath: string, baseUrl: string, options: { header?: string[], format: string, quiet: boolean, plugin?: string }) => {
    const start = performance.now();
    try {
      const { loadConfig, runSmokeTest } = await import("../core/index.js");
      const { fireWebhooks } = await import("./utils.js");
      const { renderJunitTestReport, renderMarkdownTestReport, renderSmileTestReport } = await import("../reporters/index.js");
      const { emitGithubStepSummary } = await import("../reporters/utils.js");
      
      const config = loadConfig();
      if (options.plugin) {
        config.plugins = [...(config.plugins || []), options.plugin];
      }
      
      let outputFormat = options.format;
      if (config.format && options.format === "text") {
        outputFormat = config.format;
      }

      const headersRecord: Record<string, string> = { ...(config.testHeaders || {}) };
      if (options.header) {
        for (const h of options.header) {
          const firstColon = h.indexOf(":");
          if (firstColon === -1) {
            if (!options.quiet) console.warn(`⚠️ Warning: Invalid header format "${h}". Expected "Key: Value".`);
            continue;
          }
          const key = h.slice(0, firstColon).trim();
          const value = h.slice(firstColon + 1).trim();
          headersRecord[key] = value;
        }
      }

      const result = await runSmokeTest(specPath, baseUrl, headersRecord);
      
      // Always generate step summary in Github Actions if we're running tests
      if (process.env.GITHUB_ACTIONS === "true") {
        emitGithubStepSummary(renderMarkdownTestReport(result));
      }

      if (outputFormat === "json") {
        console.log(JSON.stringify(result, null, 2));
      } else if (outputFormat === "markdown") {
        console.log(renderMarkdownTestReport(result));
      } else if (outputFormat === "junit") {
        console.log(renderJunitTestReport(result));
      } else {
        if (!options.quiet) {
          console.log(renderSmileTestReport(result));
          const duration = Math.round(performance.now() - start);
          console.log(`\n⏱️  Done in ${duration}ms`);
        }
      }

      process.exitCode = result.passed ? 0 : 1;

      if (!result.passed) {
        await fireWebhooks(config.webhooks, result);
      }
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
      const { runInitCommand } = await import("./commands/initCommand.js");
      await runInitCommand();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Failed to initialize smile: ${message}`);
      process.exitCode = 1;
    }
  });

program
  .command("install-hook")
  .description("Install a native git pre-commit hook that runs 'smile lint .' before every commit")
  .action(async () => {
    try {
      const { installHook } = await import("./commands/hookCommand.js");
      await installHook();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Failed to install git hook: ${message}`);
      process.exitCode = 1;
    }
  });

program
  .command("config")
  .description("Smile Config: View your currently active configuration and rule overrides")
  .action(async () => {
    try {
      const { runConfigCommand } = await import("./commands/configCommand.js");
      await runConfigCommand();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Config command failed: ${message}`);
      process.exitCode = 1;
    }
  });

program
  .command("deduce <specPath>")
  .description("Smile Deduce: Interactively solve contract violations using deduction (Auto-fixer)")
  .action(async (specPath: string) => {
    try {
      const { runDeduceCommand } = await import("./commands/deduceCommand.js");
      await runDeduceCommand(specPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Deduce failed: ${message}`);
      process.exitCode = 1;
    }
  });

program.parse(process.argv);