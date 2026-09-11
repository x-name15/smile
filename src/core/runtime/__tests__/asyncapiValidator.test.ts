import { describe, it, expect } from "vitest";
import path from "node:path";
import { validateAsyncApiMessage } from "../asyncapiValidator.js";

const fixturesDir = path.resolve(__dirname, "../../../../fixtures");

describe("AsyncAPI Runtime Message Validation", () => {
  const asyncApiV2Path = path.join(fixturesDir, "sample-asyncapi-clean.yaml");
  const asyncApiV3Path = path.join(fixturesDir, "sample-asyncapi-v3-clean.yaml");

  it("passes when message payload matches AsyncAPI 2.x channel contract", async () => {
    const validMessage = {
      userId: "usr_12345",
      email: "alice@example.com",
    };

    const violations = await validateAsyncApiMessage(asyncApiV2Path, "user/signedup", validMessage);
    expect(violations).toHaveLength(0);
  });

  it("fails when message payload violates AsyncAPI 2.x schema types", async () => {
    const invalidMessage = {
      userId: 12345, // should be string
      email: true,   // should be string
    };

    const violations = await validateAsyncApiMessage(asyncApiV2Path, "user/signedup", invalidMessage);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe("asyncapi-payload-contract-breach");
  });

  it("passes when message payload matches AsyncAPI 3.x channel contract", async () => {
    const validOrder = {
      orderId: "ord_999",
      total: 149.99,
    };

    const violations = await validateAsyncApiMessage(asyncApiV3Path, "orderCreated", validOrder);
    expect(violations).toHaveLength(0);
  });

  it("fails when channel does not exist in spec", async () => {
    const violations = await validateAsyncApiMessage(asyncApiV2Path, "nonExistentChannel", {});
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleId).toBe("missing-asyncapi-message-schema");
  });
});
