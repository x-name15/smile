/**
 * @fileoverview Deterministic, safe autofix engine for smile.
 * Fixes non-destructive contract violations (such as missing operationIds and summaries)
 * while preserving formatting, indentation, and comments using AST manipulation.
 */

import { readFileSync, writeFileSync } from "node:fs";
import yaml from "yaml";
import { detectSpecFormat } from "../detectSpecFormat.js";
import { ESpecFormat } from "../../models/index.js";

export interface IFixFileResult {
  filePath: string;
  fixedCount: number;
  changes: string[];
}

const HTTP_METHODS = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
] as const;

/**
 * Generates a clean canonical camelCase operationId from an HTTP method and path template.
 * Example: "get" and "/api/v1/users/{id}" -> "getApiV1UsersById"
 */
export function generateCanonicalOperationId(method: string, pathKey: string): string {
  const segments = pathKey.split("/").filter(Boolean);
  const formattedSegments = segments.map(seg => {
    const isParam = seg.startsWith("{") && seg.endsWith("}");
    const raw = isParam ? seg.slice(1, -1) : seg;
    const words = raw.split(/[-_]/).filter(Boolean);
    const capitalized = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("");
    return isParam ? `By${capitalized}` : capitalized;
  });

  return method.toLowerCase() + formattedSegments.join("");
}

/**
 * Generates a human-readable summary from an HTTP method and path.
 * Example: "get" and "/users" -> "Get users"
 */
export function generateCanonicalSummary(method: string, pathKey: string): string {
  const cleanPath = pathKey.replace(/\{([^}]+)\}/g, ":$1");
  const verb = method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();
  return `${verb} ${cleanPath}`;
}

/**
 * Safely applies fixes to an OpenAPI specification file.
 * Preserves comments and indentation in YAML via AST manipulation.
 */
export function fixOpenApiFile(filePath: string): IFixFileResult {
  const rawContent = readFileSync(filePath, "utf-8");
  const isJson = filePath.endsWith(".json");
  const changes: string[] = [];
  let fixedCount = 0;

  if (isJson) {
    let parsedJson: Record<string, unknown>;
    try {
      parsedJson = JSON.parse(rawContent);
    } catch {
      return { filePath, fixedCount: 0, changes: [] };
    }

    const paths = (parsedJson.paths || {}) as Record<string, Record<string, unknown>>;
    for (const [pathKey, pathItem] of Object.entries(paths)) {
      if (!pathItem || typeof pathItem !== "object") continue;
      for (const method of HTTP_METHODS) {
        const operation = pathItem[method] as Record<string, unknown> | undefined;
        if (!operation || typeof operation !== "object") continue;

        if (!operation.operationId) {
          const generatedId = generateCanonicalOperationId(method, pathKey);
          operation.operationId = generatedId;
          changes.push(`Added operationId "${generatedId}" to ${method.toUpperCase()} ${pathKey}`);
          fixedCount++;
        }

        if (!operation.summary) {
          const generatedSummary = generateCanonicalSummary(method, pathKey);
          operation.summary = generatedSummary;
          changes.push(`Added summary "${generatedSummary}" to ${method.toUpperCase()} ${pathKey}`);
          fixedCount++;
        }
      }
    }

    if (fixedCount > 0) {
      writeFileSync(filePath, JSON.stringify(parsedJson, null, 2) + "\n", "utf-8");
    }
  } else {
    // YAML handling preserving comments and formatting
    const doc = yaml.parseDocument(rawContent);
    const pathsNode = doc.get("paths") as yaml.YAMLMap | undefined;

    if (pathsNode && yaml.isMap(pathsNode)) {
      for (const pathPair of pathsNode.items) {
        const pathKey = String(pathPair.key);
        const pathValue = pathPair.value;

        if (yaml.isMap(pathValue)) {
          for (const method of HTTP_METHODS) {
            const operationNode = pathValue.get(method) as yaml.YAMLMap | undefined;
            if (operationNode && yaml.isMap(operationNode)) {
              if (!operationNode.has("operationId")) {
                const generatedId = generateCanonicalOperationId(method, pathKey);
                operationNode.set("operationId", generatedId);
                changes.push(`Added operationId "${generatedId}" to ${method.toUpperCase()} ${pathKey}`);
                fixedCount++;
              }

              if (!operationNode.has("summary")) {
                const generatedSummary = generateCanonicalSummary(method, pathKey);
                operationNode.set("summary", generatedSummary);
                changes.push(`Added summary "${generatedSummary}" to ${method.toUpperCase()} ${pathKey}`);
                fixedCount++;
              }
            }
          }
        }
      }
    }

    if (fixedCount > 0) {
      writeFileSync(filePath, doc.toString(), "utf-8");
    }
  }

  return {
    filePath,
    fixedCount,
    changes,
  };
}

/**
 * Fixes a specification file if it matches a supported format and safe rules.
 */
export function fixSpecFile(filePath: string): IFixFileResult {
  try {
    const format = detectSpecFormat(filePath);
    if (format === ESpecFormat.OpenApi) {
      return fixOpenApiFile(filePath);
    }
  } catch {
    // Ignore unsupported or unparseable files
  }

  return {
    filePath,
    fixedCount: 0,
    changes: [],
  };
}
