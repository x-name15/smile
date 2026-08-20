import type {
  DocumentNode,
  ObjectTypeDefinitionNode,
  ObjectTypeExtensionNode,
  SchemaDefinitionNode,
  SchemaExtensionNode,
  FieldDefinitionNode,
  TypeNode,
} from "graphql";
import { parseGraphQLSpec } from "../../parsers/graphql.js";
import {
  ESeverity,
  ESpecFormat,
  type IEndpointTestResult,
  type ITestResult,
  type IViolation,
} from "../../models/index.js";

/**
 * Gets the base type name by unwrapping NonNull and List types.
 */
function getBaseTypeName(typeNode: TypeNode): string {
  if (typeNode.kind === "NonNullType" || typeNode.kind === "ListType") {
    return getBaseTypeName(typeNode.type);
  }
  return typeNode.name.value;
}

/**
 * Checks if a field has any required arguments.
 */
function hasRequiredArgs(field: FieldDefinitionNode): boolean {
  if (!field.arguments) return false;
  return field.arguments.some((arg) => arg.type.kind === "NonNullType");
}

/**
 * Determines if a type requires a selection set (i.e., it's not a scalar/enum).
 */
function requiresSelectionSet(typeName: string, doc: DocumentNode): boolean {
  const builtinScalars = ["Int", "Float", "String", "Boolean", "ID"];
  if (builtinScalars.includes(typeName)) return false;

  const typeDef = doc.definitions.find(
    (def) => "name" in def && def.name?.value === typeName,
  );

  if (!typeDef) return true; // Default to true if unknown

  return (
    typeDef.kind === "ObjectTypeDefinition" ||
    typeDef.kind === "InterfaceTypeDefinition" ||
    typeDef.kind === "UnionTypeDefinition"
  );
}

/**
 * Tests a single GraphQL query field against a live server.
 */
async function testGraphQLField(
  baseUrl: string,
  field: FieldDefinitionNode,
  doc: DocumentNode,
  headers?: Record<string, string>,
): Promise<IEndpointTestResult> {
  const fieldName = field.name.value;
  const label = `Query.${fieldName}`;

  if (hasRequiredArgs(field)) {
    return {
      method: "POST",
      path: `(GraphQL) ${fieldName}`,
      violations: [],
      skipped: true,
      skipReason: "Field has required arguments, cannot be auto-tested",
    };
  }

  const baseTypeName = getBaseTypeName(field.type);
  const needsSelection = requiresSelectionSet(baseTypeName, doc);
  
  // We use __typename for objects to avoid infinite loops and complex mock data generation
  const selectionSet = needsSelection ? " { __typename }" : "";
  const queryStr = `query { ${fieldName}${selectionSet} }`;

  let response: Response;
  try {
    response = await fetch(new URL(baseUrl).toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({ query: queryStr }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      method: "POST",
      path: `(GraphQL) ${fieldName}`,
      skipped: false,
      violations: [
        {
          ruleId: "endpoint-unreachable",
          severity: ESeverity.Error,
          message: `Could not reach ${baseUrl}: ${message}`,
          path: label,
        },
      ],
    };
  }

  const violations: IViolation[] = [];
  
  if (!response.ok) {
    violations.push({
      ruleId: "unexpected-status-code",
      severity: ESeverity.Error,
      message: `Expected 200 OK, got ${response.status}`,
      path: label,
    });
  } else {
    const body: any = await response.json().catch(() => ({}));
    if (body.errors && Array.isArray(body.errors) && body.errors.length > 0) {
      violations.push({
        ruleId: "graphql-response-errors",
        severity: ESeverity.Error,
        message: `GraphQL server returned errors: ${body.errors[0]?.message}`,
        path: label,
      });
    }
  }

  return {
    method: "POST",
    path: `(GraphQL) ${fieldName}`,
    violations,
    skipped: false,
  };
}

export async function runGraphQLSmokeTest(
  sourcePath: string,
  baseUrl: string,
  headers?: Record<string, string>,
): Promise<ITestResult> {
  const parsed = await parseGraphQLSpec(sourcePath);
  const doc = parsed.raw as DocumentNode;

  const endpoints: IEndpointTestResult[] = [];
  
  const schemaDefinition = doc.definitions.find(
    (def): def is SchemaDefinitionNode | SchemaExtensionNode =>
      (def.kind === "SchemaDefinition" || def.kind === "SchemaExtension") &&
      def.operationTypes?.some((operation) => operation.operation === "query") === true,
  );
    const queryTypeName = schemaDefinition?.operationTypes?.find(
    (operation) => operation.operation === "query",
  )?.type.name.value ?? "Query";

  const queryType = doc.definitions.find(
    (def): def is ObjectTypeDefinitionNode => 
      def.kind === "ObjectTypeDefinition" && def.name.value === queryTypeName,
  ) ?? doc.definitions.find(
    (def): def is ObjectTypeExtensionNode =>
      def.kind === "ObjectTypeExtension" && def.name.value === queryTypeName,
  );

  if (queryType && queryType.fields) {
    for (const field of queryType.fields) {
      endpoints.push(await testGraphQLField(baseUrl, field, doc, headers));
    }
  }

  const passed = endpoints.every((endpoint) => 
    endpoint.violations.every((v) => v.severity !== ESeverity.Error)
  );

  return {
    format: ESpecFormat.GraphQL,
    baseUrl,
    passed,
    endpoints,
    sourcePath,
  };
}
