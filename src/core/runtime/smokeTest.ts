import { detectSpecFormat } from "../detectSpecFormat.js";
import { runOpenApiSmokeTest } from "./openapiTester.js";
import { runPostmanSmokeTest } from "./postmanTester.js";
import { runGraphQLSmokeTest } from "./graphqlTester.js";
import { ESpecFormat, type ITestResult } from "../../models/index.js";
import type { ISmileConfig } from "../../models/index.js";

/**
 * Runs the Breaching Detector smoke test against a live server.
 * Dispatches to the format-specific tester.
 */
export async function runSmokeTest(
  sourcePath: string,
  baseUrl: string,
  headers?: Record<string, string>,
  config?: Pick<ISmileConfig, "requestTimeoutMs">,
): Promise<ITestResult> {
  const format = detectSpecFormat(sourcePath);

  switch (format) {
    case ESpecFormat.OpenApi:
      return runOpenApiSmokeTest(sourcePath, baseUrl, headers, config?.requestTimeoutMs);
    case ESpecFormat.Postman:
      return runPostmanSmokeTest(sourcePath, baseUrl, headers, config?.requestTimeoutMs);
    case ESpecFormat.GraphQL:
      return runGraphQLSmokeTest(sourcePath, baseUrl, headers, config?.requestTimeoutMs);
    default:
      throw new Error(
        `The Breaching Detector (smile test) currently only supports OpenAPI, Postman, and GraphQL specs. Detected format: ${format}`,
      );
  }
}