import { detectSpecFormat } from "../detectSpecFormat.js";
import { runOpenApiSmokeTest } from "./openapiTester.js";
import { runPostmanSmokeTest } from "./postmanTester.js";
import { ESpecFormat, type ITestResult } from "../../models/index.js";

/**
 * Runs the Breaching Detector smoke test against a live server.
 * Dispatches to the format-specific tester.
 */
export async function runSmokeTest(
  sourcePath: string,
  baseUrl: string,
  headers?: Record<string, string>,
): Promise<ITestResult> {
  const format = detectSpecFormat(sourcePath);

  switch (format) {
    case ESpecFormat.OpenApi:
      return runOpenApiSmokeTest(sourcePath, baseUrl, headers);
    case ESpecFormat.Postman:
      return runPostmanSmokeTest(sourcePath, baseUrl, headers);
    default:
      throw new Error(
        `The Breaching Detector (smile test) currently only supports OpenAPI and Postman specs. Detected format: ${format}`,
      );
  }
}