import { statSync, readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import ignore from "ignore";

/**
 * Recursively searches a directory for valid API specification files.
 * Automatically respects `.smileignore` (if present in the root),
 * as well as common ignore patterns like `node_modules` and `.git`.
 * 
 * @param basePath The root directory to start searching from (or a single file path).
 * @returns An array of absolute paths to discovered specification files.
 * @throws If the provided path does not exist.
 */
export function findSpecFiles(basePath: string): string[] {
  if (!existsSync(basePath)) {
    throw new Error(`Path does not exist: ${basePath}`);
  }

  const stat = statSync(basePath);
  if (!stat.isDirectory()) {
    return [basePath];
  }

  // Load .smileignore
  const ig = ignore();
  
  // Also ignore node_modules and .git by default for safety
  ig.add(["node_modules", ".git"]);
  
  const ignorePath = join(basePath, ".smileignore");
  if (existsSync(ignorePath)) {
    ig.add(readFileSync(ignorePath, "utf-8"));
  }

  const results: string[] = [];
  const validExtensions = [".yaml", ".yml", ".json", ".graphql", ".gql"];

  function traverse(currentDir: string) {
    const files = readdirSync(currentDir);
    for (const file of files) {
      const fullPath = join(currentDir, file);
      const relPath = relative(basePath, fullPath);
      
      // We must pass POSIX paths to ignore
      const posixPath = relPath.split("\\").join("/");

      if (ig.ignores(posixPath)) {
        continue;
      }

      const fileStat = statSync(fullPath);
      if (fileStat.isDirectory()) {
        traverse(fullPath);
      } else {
        if (validExtensions.some(ext => file.endsWith(ext))) {
          // Additional check: exclude config.smile.json and package.json to avoid linting configs
          if (file === "config.smile.json" || file === "smile.config.json" || file === "package.json" || file === "package-lock.json") {
             continue;
          }
          results.push(fullPath);
        }
      }
    }
  }

  traverse(basePath);
  return results;
}

/**
 * Fires a POST HTTP request to a list of webhook URLs, broadcasting
 * that a contract violation was detected. Designed for Slack, Discord, 
 * or Microsoft Teams alerts.
 * 
 * @param webhooks Array of endpoint URLs.
 * @param summary The JSON payload containing the violation details to broadcast.
 */
export async function fireWebhooks(webhooks: string[] | undefined, summary: unknown): Promise<void> {
  if (!webhooks || webhooks.length === 0) return;
  
  const payload = JSON.stringify({
    text: `🚨 Smile ☺ Contract Violation Detected!`,
    details: summary
  });

  const promises = webhooks.map(async (url) => {
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload
      });
    } catch (e) {
      console.warn(`Failed to fire webhook to ${url}: ${e}`);
    }
  });

  await Promise.allSettled(promises);
}
