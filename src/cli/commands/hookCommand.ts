import { existsSync } from "node:fs";
import { mkdir, writeFile, chmod } from "node:fs/promises";
import path from "node:path";
import * as p from "@clack/prompts";

const HOOK_SCRIPT = `#!/bin/sh
# smile pre-commit hook

echo "🩺 Running smile contract linter..."

if command -v smile >/dev/null 2>&1; then
  smile lint .
else
  npx --yes @mrjacket/smile lint .
fi

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ API contract violations found. Commit aborted."
  echo "Please fix the errors or run 'npx @mrjacket/smile deduce <spec>' before committing."
  exit 1
fi
`;

/**
 * Installs a native git pre-commit hook into the current repository.
 * The hook runs `smile lint .` and aborts the commit if violations are found.
 * 
 * Assumes the current working directory is the root of a git repository.
 * Does not require external dependencies like Husky.
 */
export async function installHook(): Promise<void> {
  p.intro("Hook Installer");

  const gitDir = path.resolve(process.cwd(), ".git");
  if (!existsSync(gitDir)) {
    p.log.error("Not a git repository. Cannot install pre-commit hook.");
    p.outro("Aborted.");
    process.exit(1);
  }

  const hooksDir = path.resolve(gitDir, "hooks");
  const hookPath = path.resolve(hooksDir, "pre-commit");

  await mkdir(hooksDir, { recursive: true });

  let shouldOverwrite = false;
  try {
    await writeFile(hookPath, HOOK_SCRIPT, { encoding: "utf-8", flag: "wx" });
  } catch (error: any) {
    if (error.code === "EEXIST") {
      const overwrite = await p.confirm({
        message: "A pre-commit hook already exists. Overwrite it?",
        initialValue: false,
      });

      if (!overwrite || p.isCancel(overwrite)) {
        p.cancel("Installation cancelled.");
        process.exit(0);
      }
      shouldOverwrite = true;
    } else {
      p.log.error(`Failed to install hook: ${error}`);
      process.exit(1);
    }
  }

  if (shouldOverwrite) {
    try {
      await writeFile(hookPath, HOOK_SCRIPT, "utf-8");
    } catch (error) {
      p.log.error(`Failed to overwrite hook: ${error}`);
      process.exit(1);
    }
  }

  try {
    // Make it executable (755)
    await chmod(hookPath, 0o755);
    p.log.success("Successfully installed smile pre-commit hook.");
    p.outro("Your API contracts are now protected from bad commits! 🛡️");
  } catch (error) {
    p.log.error(`Failed to set permissions: ${error}`);
    process.exit(1);
  }
}

/**
 * Removes the native git pre-commit hook from the current repository.
 */
export async function uninstallHook(): Promise<void> {
  p.intro("Hook Uninstaller");

  const gitDir = path.resolve(process.cwd(), ".git");
  if (!existsSync(gitDir)) {
    p.log.error("Not a git repository. Cannot find pre-commit hook.");
    p.outro("Aborted.");
    process.exit(1);
  }

  const hookPath = path.resolve(gitDir, "hooks", "pre-commit");
  if (!existsSync(hookPath)) {
    p.log.info("No pre-commit hook found in this repository.");
    p.outro("Nothing to do.");
    return;
  }

  try {
    const { unlink } = await import("node:fs/promises");
    await unlink(hookPath);
    p.log.success("Successfully removed smile pre-commit hook.");
    p.outro("Git hook removed. 🛡️");
  } catch (error) {
    p.log.error(`Failed to remove hook: ${error}`);
    process.exit(1);
  }
}
