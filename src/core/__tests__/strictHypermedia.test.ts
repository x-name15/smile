import { describe, it, expect } from "vitest";
import { ruleStrictHypermedia } from "../rules/openapi/strict-hypermedia.js";
import type { OpenAPIV3 } from "openapi-types";

describe("ruleStrictHypermedia", () => {
  it("returns no violations for normal application/json", () => {
    const doc: OpenAPIV3.Document = {
      openapi: "3.0.0",
      info: { title: "Test", version: "1" },
      paths: {
        "/users": {
          get: {
            responses: {
              "200": {
                description: "OK",
                content: {
                  "application/json": {
                    schema: { type: "object", properties: { name: { type: "string" } } }
                  }
                }
              }
            }
          }
        }
      }
    };
    
    const violations = ruleStrictHypermedia(doc);
    expect(violations).toHaveLength(0);
  });

  it("returns a violation if application/vnd.api+json has no data, meta, or errors", () => {
    const doc: OpenAPIV3.Document = {
      openapi: "3.0.0",
      info: { title: "Test", version: "1" },
      paths: {
        "/users": {
          get: {
            responses: {
              "200": {
                description: "OK",
                content: {
                  "application/vnd.api+json": {
                    schema: { type: "object", properties: { name: { type: "string" } } }
                  }
                }
              }
            }
          }
        }
      }
    };
    
    const violations = ruleStrictHypermedia(doc);
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleId).toBe("strict-hypermedia");
    expect(violations[0].message).toContain("JSON:API");
  });

  it("returns no violations if application/vnd.api+json has data", () => {
    const doc: OpenAPIV3.Document = {
      openapi: "3.0.0",
      info: { title: "Test", version: "1" },
      paths: {
        "/users": {
          get: {
            responses: {
              "200": {
                description: "OK",
                content: {
                  "application/vnd.api+json": {
                    schema: { type: "object", properties: { data: { type: "object" } } }
                  }
                }
              }
            }
          }
        }
      }
    };
    
    const violations = ruleStrictHypermedia(doc);
    expect(violations).toHaveLength(0);
  });

  it("returns a violation if application/hal+json has no _links", () => {
    const doc: OpenAPIV3.Document = {
      openapi: "3.0.0",
      info: { title: "Test", version: "1" },
      paths: {
        "/users": {
          get: {
            responses: {
              "200": {
                description: "OK",
                content: {
                  "application/hal+json": {
                    schema: { type: "object", properties: { name: { type: "string" } } }
                  }
                }
              }
            }
          }
        }
      }
    };
    
    const violations = ruleStrictHypermedia(doc);
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleId).toBe("strict-hypermedia");
    expect(violations[0].message).toContain("HAL");
  });

  it("returns no violations if application/hal+json has _links", () => {
    const doc: OpenAPIV3.Document = {
      openapi: "3.0.0",
      info: { title: "Test", version: "1" },
      paths: {
        "/users": {
          get: {
            responses: {
              "200": {
                description: "OK",
                content: {
                  "application/hal+json": {
                    schema: { type: "object", properties: { _links: { type: "object" } } }
                  }
                }
              }
            }
          }
        }
      }
    };
    
    const violations = ruleStrictHypermedia(doc);
    expect(violations).toHaveLength(0);
  });
});
