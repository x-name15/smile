import { statSync, readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import ignore from "ignore";

const EXCLUDED_FILENAMES = new Set([
  // Smile config files
  "config.smile.json",
  "smile.config.json",
  ".smilerc.json",
  "smile.json",
  // Package manifests & lockfiles
  "package.json",
  "package-lock.json",
  "npm-shrinkwrap.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lockb",
  "bun.lock",
  "composer.json",
  "composer.lock",
  // Tool and framework configurations
  "turbo.json",
  "nx.json",
  "lerna.json",
  "biome.json",
  "deno.json",
  "components.json",
]);

function isExcludedFile(filename: string): boolean {
  if (filename.startsWith(".")) return true;
  if (EXCLUDED_FILENAMES.has(filename)) return true;
  if (/^(tsconfig|jsconfig)(\..+)?\.json$/i.test(filename)) return true;
  return false;
}

/**
 * Recursively searches a directory for valid API specification files.
 * Automatically respects `.gitignore` and `.smileignore` (if present in the root),
 * as well as common ignore patterns like `node_modules`, `.git`, `dist`, `build`, and `coverage`.
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
  const ig = ignore();
  
  ig.add(["node_modules", ".git", "dist", "build", "coverage"]);
  
  const gitignorePath = join(basePath, ".gitignore");
  if (existsSync(gitignorePath)) {
    try {
      ig.add(readFileSync(gitignorePath, "utf-8"));
    } catch {
      // Gracefully ignore .gitignore read error
    }
  }

  const ignorePath = join(basePath, ".smileignore");
  if (existsSync(ignorePath)) {
    try {
      ig.add(readFileSync(ignorePath, "utf-8"));
    } catch {
      // Gracefully ignore .smileignore read error
    }
  }

  const results: string[] = [];
  const validExtensions = [".yaml", ".yml", ".json", ".graphql", ".gql", ".proto"];

  function traverse(currentDir: string) {
    const files = readdirSync(currentDir);
    for (const file of files) {
      const fullPath = join(currentDir, file);
      const relPath = relative(basePath, fullPath);
      const posixPath = relPath.split("\\").join("/");

      if (ig.ignores(posixPath)) {
        continue;
      }

      const fileStat = statSync(fullPath);
      if (fileStat.isDirectory()) {
        traverse(fullPath);
      } else {
        if (validExtensions.some(ext => file.endsWith(ext))) {
          if (isExcludedFile(file)) {
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
      const response = await fetch(new URL(url).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload
      });
      if (!response.ok) {
        console.warn(`Webhook responded with HTTP ${response.status} for ${url}`);
      }
    } catch (e) {
      console.warn(`Failed to fire webhook to ${url}: ${e}`);
    }
  });

  await Promise.allSettled(promises);
}
