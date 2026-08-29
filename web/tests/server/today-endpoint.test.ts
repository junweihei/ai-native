import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildServer } from "../../server/app.js";
import { TestLearningIndexAdapter } from "../fixtures/test-learning-index-adapter.js";

let app: FastifyInstance | undefined;
afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe("today endpoint", () => {
  it("returns the adapter projection without browser-side repository access", async () => {
    app = await buildServer({ dataAdapter: new TestLearningIndexAdapter() });
    const response = await app.inject({ method: "GET", url: "/api/v1/today" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      context: { task_id: "M01-D02", task: { executable: true } },
    });
  }, 30_000);
});
