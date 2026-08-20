import { parsePostmanSpec } from "../../parsers/postman.js";
import { validateResponseAgainstSchema } from "./validateResponse.js";
import {
  ESeverity,
  ESpecFormat,
  type IEndpointTestResult,
  type ITestResult,
  type IViolation,
  type IPostmanCollection,
  type IPostmanItem,
  type IPostmanResponse
} from "../../models/index.js";

/**
 * Infers a basic JSON schema from a JSON string payload.
 * We use this to dynamically generate a schema from a Postman example
 * so we can validate the real response structurally rather than strictly.
 */
function inferSchemaFromJsonString(jsonString: string): any {
  try {
    const parsed = JSON.parse(jsonString);
    return inferSchemaFromValue(parsed);
  } catch (e) {
    return { type: "string" }; // Not JSON, assume string text
  }
}

function inferSchemaFromValue(value: any): any {
  if (value === null) return { nullable: true };
  if (Array.isArray(value)) {
    if (value.length > 0) {
      return { type: "array", items: inferSchemaFromValue(value[0]) };
    }
    return { type: "array" };
  }
  if (typeof value === "object") {
    const properties: Record<string, any> = {};
    const required: string[] = [];
    for (const key of Object.keys(value)) {
      properties[key] = inferSchemaFromValue(value[key]);
      required.push(key);
    }
    return { type: "object", properties, required: required.length ? required : undefined };
  }
  
  if (typeof value === "string") return { type: "string" };
  if (typeof value === "number") return { type: "number" };
  if (typeof value === "boolean") return { type: "boolean" };
  
  return {};
}

function extractPath(urlObj: any): string {
  if (typeof urlObj === "string") return urlObj;
  if (urlObj && typeof urlObj === "object" && urlObj.raw) return urlObj.raw;
  return "unknown";
}

async function testPostmanItem(
  baseUrl: string,
  item: IPostmanItem,
  headers?: Record<string, string>
): Promise<IEndpointTestResult | null> {
  if (!item.request || !item.response || item.response.length === 0) {
    return null; // Not testable, maybe a folder or lacks an example response
  }

  const method = (item.request.method || "GET").toUpperCase();
  const rawPath = extractPath(item.request.url);
  // Remove Postman variables like {{baseUrl}} and replace with our baseUrl
  const cleanPath = rawPath.replace(/\{\{[^}]+\}\}/g, "").replace(/^\/+/, "");
  const url = /^https?:\/\//i.test(rawPath.trim())
    ? rawPath.trim()
    : `${baseUrl.replace(/\/$/, "")}/${cleanPath}`;
  const label = `${method} ${rawPath}`;

  const expectedResponse = item.response[0];
  const expectedStatusCode = expectedResponse.code?.toString() ?? "200";

  let bodyData: any = undefined;
  if (item.request.body?.mode === "raw" && item.request.body.raw) {
    bodyData = item.request.body.raw;
  }

  const fetchOptions: RequestInit = {
    method,
    headers: {
      ...headers,
      ...(bodyData ? { "Content-Type": "application/json" } : {}),
    },
  };
  
  if (bodyData) {
    fetchOptions.body = bodyData;
  }

  let response: Response;
  try {
    response = await fetch(new URL(url).toString(), fetchOptions);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      method,
      path: rawPath,
      skipped: false,
      violations: [
        {
          ruleId: "endpoint-unreachable",
          severity: ESeverity.Error,
          message: `Could not reach ${url}: ${message}`,
          path: label,
        },
      ],
    };
  }

  const violations: IViolation[] = [];
  if (String(response.status) !== expectedStatusCode) {
    violations.push({
      ruleId: "unexpected-status-code",
      severity: ESeverity.Error,
      message: `Expected status ${expectedStatusCode}, got ${response.status}`,
      path: label,
    });
  } else if (expectedResponse.body) {
    const resBody: unknown = await response.json().catch(() => undefined);
    const inferredSchema = inferSchemaFromJsonString(expectedResponse.body);
    const actualMediaType = response.headers.get("content-type")?.split(";")[0]?.trim();
    violations.push(...validateResponseAgainstSchema(inferredSchema, resBody, label, actualMediaType));
  }

  return {
    method,
    path: rawPath,
    violations,
    skipped: false,
  };
}

function gatherItems(items: IPostmanItem[]): IPostmanItem[] {
  let result: IPostmanItem[] = [];
  for (const item of items) {
    if (item.item) {
      result = result.concat(gatherItems(item.item));
    } else {
      result.push(item);
    }
  }
  return result;
}

export async function runPostmanSmokeTest(
  sourcePath: string,
  baseUrl: string,
  headers?: Record<string, string>,
): Promise<ITestResult> {
  const parsed = await parsePostmanSpec(sourcePath);
  const doc = parsed.raw as IPostmanCollection;
  const endpoints: IEndpointTestResult[] = [];

  const allItems = gatherItems(doc.item ?? []);
  
  for (const item of allItems) {
    const testResult = await testPostmanItem(baseUrl, item, headers);
    if (testResult) {
      endpoints.push(testResult);
    }
  }

  const passed = endpoints.every((endpoint) => 
    endpoint.violations.every((v) => v.severity !== ESeverity.Error)
  );

  return {
    format: ESpecFormat.Postman,
    baseUrl,
    passed,
    endpoints,
    sourcePath,
  };
}
