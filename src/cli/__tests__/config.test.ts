import { beforeEach, describe, expect, it, vi } from "vitest";
import * as p from "@clack/prompts";
import { RULES_BY_FORMAT } from "../templates.js";
import { runConfigCommand } from "../commands/configCommand.js";
import * as core from "../../core/index.js";
import type { ISmileConfig } from "../../models/index.js";

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  note: vi.fn(),
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("RULES_BY_FORMAT parity", () => {
  const EXPECTED_FORMATS = [
    "openapi",
    "asyncapi",
    "graphql",
    "jsonschema",
    "grpc",
    "postman",
  ];

  it("contains all 6 supported spec formats", () => {
    expect(Object.keys(RULES_BY_FORMAT).sort()).toEqual(EXPECTED_FORMATS.sort());
  });

  it("has exactly 32 rule bindings across formats and 30 unique rule IDs", () => {
    const allRules = Object.values(RULES_BY_FORMAT).flat();
    expect(allRules).toHaveLength(32);
    // 'missing-operation-id' and 'untyped-schema-property' are shared between openapi and asyncapi
    expect(new Set(allRules).size).toBe(30);
  });

  it("contains all expected OpenAPI rules", () => {
    expect(RULES_BY_FORMAT.openapi).toEqual([
      "missing-summary",
      "missing-operation-id",
      "missing-responses",
      "no-2xx-response",
      "untyped-schema-property",
      "valid-examples",
      "require-security",
      "no-http-verbs-in-path",
      "strict-hypermedia",
      "valid-path-parameters",
    ]);
  });

  it("contains all expected AsyncAPI rules", () => {
    expect(RULES_BY_FORMAT.asyncapi).toEqual([
      "missing-operation-id",
      "missing-message",
      "missing-channel-description",
      "missing-message-description",
      "untyped-schema-property",
    ]);
  });

  it("contains all expected GraphQL rules", () => {
    expect(RULES_BY_FORMAT.graphql).toEqual([
      "missing-type-description",
      "missing-field-description",
      "deprecated-without-reason",
      "missing-enum-value-description",
      "require-pascal-case-types",
      "require-camel-case-fields",
    ]);
  });

  it("contains all expected JSON Schema rules", () => {
    expect(RULES_BY_FORMAT.jsonschema).toEqual([
      "missing-title",
      "missing-description",
      "untyped-property",
      "array-without-items",
      "require-additional-properties",
    ]);
  });

  it("contains all expected gRPC rules matching core registry", () => {
    expect(RULES_BY_FORMAT.grpc).toEqual([
      "require-rpc-comments",
      "pascal-case-messages",
      "camel-case-fields",
    ]);
  });

  it("contains all expected Postman rules matching core registry", () => {
    expect(RULES_BY_FORMAT.postman).toEqual([
      "require-request-description",
      "no-empty-folders",
      "require-response-example",
    ]);
  });
});

describe("runConfigCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs cleanly with default empty configuration", async () => {
    vi.spyOn(core, "loadConfig").mockReturnValue({});

    await runConfigCommand();

    expect(p.intro).toHaveBeenCalled();
    expect(p.outro).toHaveBeenCalledWith("Observation complete.");
    expect(p.note).toHaveBeenCalledWith(
      expect.stringContaining("No custom rules found"),
      "Rules Engine"
    );
  });

  it("displays full configuration details when populated", async () => {
    const mockConfig: ISmileConfig = {
      rules: {
        "missing-summary": "error",
        "missing-operation-id": "warn",
        "no-2xx-response": "off",
        openapi: {
          "valid-examples": "warn",
        },
      },
      plugins: ["smile-plugin-custom"],
      webhooks: ["https://example.com/webhook"],
      format: "json",
      requestTimeoutMs: 5000,
      maxWarnings: 0,
      testHeaders: {
        Authorization: "Bearer token-xyz",
      },
    };

    vi.spyOn(core, "loadConfig").mockReturnValue(mockConfig);

    await runConfigCommand();

    // Verify Active Rule Overrides
    expect(p.note).toHaveBeenCalledWith(
      expect.stringContaining("missing-summary"),
      "Active Rule Overrides"
    );

    // Verify Loaded Plugins
    expect(p.note).toHaveBeenCalledWith(
      expect.stringContaining("smile-plugin-custom"),
      "Loaded Plugins"
    );

    // Verify Integrations
    expect(p.note).toHaveBeenCalledWith(
      "1 webhook(s) configured",
      "Integrations"
    );

    // Verify Display (format)
    expect(p.note).toHaveBeenCalledWith(
      expect.stringContaining("json"),
      "Display"
    );

    // Verify Network (requestTimeoutMs)
    expect(p.note).toHaveBeenCalledWith(
      expect.stringContaining("5000ms"),
      "Network"
    );

    // Verify Thresholds (maxWarnings)
    expect(p.note).toHaveBeenCalledWith(
      expect.stringContaining("0"),
      "Thresholds"
    );

    // Verify Test Headers
    expect(p.note).toHaveBeenCalledWith(
      expect.stringContaining("Authorization"),
      "Test Headers"
    );
  });
});
