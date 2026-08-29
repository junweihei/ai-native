import { describe, expect, it } from "vitest";
import { DATA_ACCESS_CONTRACT_VERSION } from "../../shared/data-contract";
import { TestLearningIndexAdapter } from "../fixtures/test-learning-index-adapter";

describe("data access boundary", () => {
  it("accepts a replaceable adapter without learning content fixtures", async () => {
    const adapter = new TestLearningIndexAdapter();

    await expect(adapter.describe()).resolves.toMatchObject({
      availability: "ready",
      schemaVersion: "test-only",
    });
    expect(DATA_ACCESS_CONTRACT_VERSION).toBe("1.0");
  });
});
