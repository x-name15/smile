import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const nodeCommand = process.execPath;
const shell = process.platform === "win32";
const temporaryDirectory = mkdtempSync(join(tmpdir(), "smile-package-smoke-"));
const consumerDirectory = join(temporaryDirectory, "consumer");
mkdirSync(consumerDirectory);

function run(command, args, options = {}) {
  const commandShell = shell && command.toLowerCase().endsWith(".cmd");
  return execFileSync(command, args, {
    cwd: consumerDirectory,
    encoding: "utf8",
    stdio: "pipe",
    shell: commandShell,
    ...options,
  });
}

function runNpm(args, cwd, options = {}) {
  return execFileSync(npmCommand, args, { cwd, shell, ...options });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  const tarballOutput = runNpm(
    ["pack", "--pack-destination", temporaryDirectory],
    projectRoot,
    { encoding: "utf8", stdio: "pipe" },
  );
  const tarballName = tarballOutput.trim().split(/\r?\n/).at(-1);
  assert(tarballName?.endsWith(".tgz"), "npm pack did not produce a tarball");

  const tarballPath = join(temporaryDirectory, tarballName);
  runNpm(["init", "-y"], consumerDirectory, { stdio: "pipe" });
  runNpm(
    ["install", "--no-save", "--no-package-lock", "--ignore-scripts", "--no-audit", "--no-fund", tarballPath],
    consumerDirectory,
    { stdio: "pipe" },
  );

  const packageApiCheck = run(nodeCommand, [
    "--input-type=module",
    "-e",
    "import { lintSpec, runSmokeTest } from '@mrjacket/smile'; if (typeof lintSpec !== 'function' || typeof runSmokeTest !== 'function') process.exit(1);",
  ]);
  assert(packageApiCheck === "", "The packaged library exports could not be imported");

  const cliBinPath = join(
    consumerDirectory,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "smile.cmd" : "smile",
  );
  assert(existsSync(cliBinPath), "npm install did not create the smile CLI binary");
  const cliPath = join(consumerDirectory, "node_modules", "@mrjacket", "smile", "dist", "cli", "index.js");
  const version = run(nodeCommand, [cliPath, "--version"]).trim();
  const packageVersion = JSON.parse(readFileSync(join(projectRoot, "package.json"), "utf8")).version;
  assert(version === packageVersion, `CLI version ${version} does not match package version ${packageVersion}`);

  const validSpecPath = join(consumerDirectory, "valid.yaml");
  writeFileSync(
    validSpecPath,
    "openapi: 3.0.0\ninfo:\n  title: E2E API\n  version: 1.0.0\npaths: {}\n",
  );
  const validOutput = run(nodeCommand, [cliPath, "lint", validSpecPath, "--format", "json", "--quiet"]);
  const validResults = JSON.parse(validOutput);
  assert(validResults[0]?.passed === true, "Packaged CLI rejected a valid specification");

  const asyncApiPath = join(consumerDirectory, "asyncapi.yaml");
  writeFileSync(
    asyncApiPath,
    "asyncapi: 2.6.0\ninfo:\n  title: E2E Events\n  version: 1.0.0\nchannels: {}\n",
  );
  const asyncApiOutput = run(nodeCommand, [cliPath, "lint", asyncApiPath, "--format", "json", "--quiet"]);
  const asyncApiResults = JSON.parse(asyncApiOutput);
  assert(asyncApiResults[0]?.format === "asyncapi", "Packaged CLI could not load AsyncAPI parser interop");

  const invalidSpecPath = join(consumerDirectory, "invalid.yaml");
  writeFileSync(
    invalidSpecPath,
    "openapi: 3.0.0\ninfo:\n  title: Invalid API\n  version: 1.0.0\npaths:\n  /users:\n    get:\n      responses:\n        '200':\n          description: ok\n",
  );
  const invalidRun = spawnSync(
    nodeCommand,
    [cliPath, "lint", invalidSpecPath, "--quiet"],
    { cwd: consumerDirectory, encoding: "utf8", shell: false },
  );
  assert(invalidRun.status === 1, `Packaged CLI returned ${invalidRun.status} for an invalid specification`);

  console.log("Package smoke test passed: library import, CLI version, valid lint, and invalid lint.");
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}