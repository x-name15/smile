import { describe, it, expect } from "vitest";
import { validateResponseAgainstSchema } from "../runtime/validateResponse.js";
import { ESeverity } from "../../models/index.js";

const userSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    age: { type: "integer" },
  },
  required: ["id", "name"],
};

describe("validateResponseAgainstSchema", () => {
  it("returns no violations for a valid response body", () => {
    const body = { id: "abc-123", name: "John Doe", age: 30 };
    const violations = validateResponseAgainstSchema(userSchema, body, "GET /users/:id");
    expect(violations).toHaveLength(0);
  });

  it("returns a violation when a required field is missing", () => {
    const body = { id: "abc-123" }; // missing 'name'
    const violations = validateResponseAgainstSchema(userSchema, body, "GET /users/:id");
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe("response-schema-mismatch");
    expect(violations[0].severity).toBe(ESeverity.Error);
  });

  it("returns a violation when a field has the wrong type", () => {
    const body = { id: "abc-123", name: "John Doe", age: "not-a-number" };
    const violations = validateResponseAgainstSchema(userSchema, body, "GET /users/:id");
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe("response-schema-mismatch");
  });

  it("returns a missing-response-schema warning when schema is null", () => {
    const violations = validateResponseAgainstSchema(null, { id: "1" }, "GET /items");
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleId).toBe("missing-response-schema");
    expect(violations[0].severity).toBe(ESeverity.Warning);
  });

  it("returns a missing-response-schema warning when schema is undefined", () => {
    const violations = validateResponseAgainstSchema(undefined, { id: "1" }, "GET /items");
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleId).toBe("missing-response-schema");
  });

  it("sets the path label correctly on violations", () => {
    const body = {}; // missing required 'id' and 'name'
    const label = "GET /users/profile";
    const violations = validateResponseAgainstSchema(userSchema, body, label);
    expect(violations.every((v) => v.path === label)).toBe(true);
  });

  it("returns all errors at once (allErrors mode)", () => {
    const body = {}; // missing both required fields
    const violations = validateResponseAgainstSchema(userSchema, body, "GET /users/:id");
    // Both 'id' and 'name' are required — should get at least 2 violations
    expect(violations.length).toBeGreaterThanOrEqual(2);
  });

  it("gracefully catches malformed schemas that throw during compilation", () => {
    // A schema with an invalid 'type' might cause ajv to throw during compile
    const malformedSchema = { type: ["string", 123] }; 
    const violations = validateResponseAgainstSchema(malformedSchema, {}, "GET /malformed");
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleId).toBe("invalid-response-schema");
    expect(violations[0].severity).toBe(ESeverity.Error);
  });

  describe("Hypermedia Validation (JSON:API)", () => {
    it("returns error if application/vnd.api+json body lacks data, meta, or errors", () => {
      const body = { id: "1" };
      const violations = validateResponseAgainstSchema(userSchema, body, "GET /", "application/vnd.api+json");
      const hypermediaViolations = violations.filter(v => v.ruleId === "strict-hypermedia-runtime");
      expect(hypermediaViolations).toHaveLength(1);
    });

    it("returns no hypermedia error if application/vnd.api+json body has data", () => {
      const body = { data: { id: "1", type: "users" } };
      const violations = validateResponseAgainstSchema(userSchema, body, "GET /", "application/vnd.api+json");
      const hypermediaViolations = violations.filter(v => v.ruleId === "strict-hypermedia-runtime");
      expect(hypermediaViolations).toHaveLength(0);
    });
  });

  describe("Hypermedia Validation (HAL)", () => {
    it("returns error if application/hal+json body lacks _links", () => {
      const body = { name: "Test" };
      const violations = validateResponseAgainstSchema(userSchema, body, "GET /", "application/hal+json");
      const hypermediaViolations = violations.filter(v => v.ruleId === "strict-hypermedia-runtime");
      expect(hypermediaViolations).toHaveLength(1);
    });

    it("returns no hypermedia error if application/hal+json body has _links", () => {
      const body = { _links: { self: { href: "/" } } };
      const violations = validateResponseAgainstSchema(userSchema, body, "GET /", "application/hal+json");
      const hypermediaViolations = violations.filter(v => v.ruleId === "strict-hypermedia-runtime");
      expect(hypermediaViolations).toHaveLength(0);
    });
  });
});
