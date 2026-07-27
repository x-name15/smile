import { readFileSync } from "node:fs";
import { parse as parseSDL } from "graphql";
import { ESpecFormat, type IParsedSpec } from "../models/index.js";

/**
 * Parses a GraphQL SDL file (.graphql / .gql).
 * Uses the reference graphql-js parser — throws on any syntax error
 * so that invalid SDL never reaches the rule engine.
 */
export async function parseGraphQLSpec(
  sourcePath: string,
): Promise<IParsedSpec> {
  const source = readFileSync(sourcePath, "utf-8");

  try {
    const document = parseSDL(source);
    return {
      format: ESpecFormat.GraphQL,
      raw: document,
      sourcePath,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid GraphQL SDL: ${message}`);
  }
}
