import { existsSync } from "node:fs";
import { mkdir, writeFile, chmod } from "node:fs/promises";
import path from "node:path";
import * as p from "@clack/prompts";

const HOOK_SCRIPT = `#!/bin/sh
# smile pre-commit hook

echo "🩺 Running smile contract linter..."
npx @mrjacket/smile lint .

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ API contract violations found. Commit aborted."
  echo "Please fix the errors or run 'npx @mrjacket/smile doctor' before committing."
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

  if (!existsSync(hooksDir)) {
    await mkdir(hooksDir, { recursive: true });
  }

  if (existsSync(hookPath)) {
    const overwrite = await p.confirm({
      message: "A pre-commit hook already exists. Overwrite it?",
      initialValue: false,
    });

    if (!overwrite || p.isCancel(overwrite)) {
      p.cancel("Installation cancelled.");
      process.exit(0);
    }
  }

  try {
    await writeFile(hookPath, HOOK_SCRIPT, "utf-8");
    // Make it executable (755)
    await chmod(hookPath, 0o755);
    p.log.success("Successfully installed smile pre-commit hook.");
    p.outro("Your API contracts are now protected from bad commits! 🛡️");
  } catch (error) {
    p.log.error(`Failed to install hook: ${error}`);
    process.exit(1);
  }
}
