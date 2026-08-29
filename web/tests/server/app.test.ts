import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildServer } from "../../server/app.js";
import { TestLearningIndexAdapter } from "../fixtures/test-learning-index-adapter.js";

let app: FastifyInstance | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe("local service boundary", () => {
  it("reports health without touching learning content", async () => {
    app = await buildServer();
    const response = await app.inject({ method: "GET", url: "/api/v1/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true });
  }, 30_000);

  it("uses an injected test adapter", async () => {
    app = await buildServer({ dataAdapter: new TestLearningIndexAdapter() });
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/data-source",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      contractVersion: "1.0",
      index: { availability: "ready", schemaVersion: "test-only" },
    });
  });
});
