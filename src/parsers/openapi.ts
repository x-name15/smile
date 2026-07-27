import SwaggerParser from "@apidevtools/swagger-parser";
import type { OpenAPI } from "openapi-types";
import { ESpecFormat, type IParsedSpec } from "../models/index.js";

/**
 * Loads an OpenAPI spec from a file path (YAML or JSON) and resolves
 * all $ref pointers. Deliberately lenient about strict spec-compliance
 * (e.g. missing `responses`) so smile's own rules — not the parser —
 * are what surface those as violations.
 */
export async function parseOpenApiSpec(
  sourcePath: string,
): Promise<IParsedSpec> {
  try {
    const document = (await SwaggerParser.dereference(
      sourcePath,
    )) as OpenAPI.Document;

    return {
      format: ESpecFormat.OpenApi,
      raw: document,
      sourcePath,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse OpenAPI spec: ${message}`);
  }
}

