import fastify, { type FastifyInstance } from "fastify";
import fastifyStatic from "@fastify/static";
import { join } from "node:path";
import type { LearningIndexAdapter } from "../shared/data-contract.js";
import { DATA_ACCESS_CONTRACT_VERSION } from "../shared/data-contract.js";
import { UnavailableLearningIndexAdapter } from "./data/unavailable-learning-index-adapter.js";

export interface BuildServerOptions {
  dataAdapter?: LearningIndexAdapter;
  serveStatic?: boolean;
}

export async function buildServer(
  options: BuildServerOptions = {},
): Promise<FastifyInstance> {
  const app = fastify({ logger: false });
  const dataAdapter =
    options.dataAdapter ?? new UnavailableLearningIndexAdapter();

  app.addHook("onSend", async (_request, reply, payload) => {
    reply.header("X-Content-Type-Options", "nosniff");
    reply.header("Referrer-Policy", "no-referrer");
    return payload;
  });

  app.get("/api/v1/health", async () => ({ ok: true }));

  app.get("/api/v1/data-source", async () => ({
    contractVersion: DATA_ACCESS_CONTRACT_VERSION,
    index: await dataAdapter.describe(),
  }));

  if (options.serveStatic) {
    await app.register(fastifyStatic, {
      root: join(process.cwd(), "dist", "client"),
      wildcard: false,
    });

    app.setNotFoundHandler(async (request, reply) => {
      if (request.url.startsWith("/api/")) {
        return reply.code(404).send({ error: "not_found" });
      }
      return reply.sendFile("index.html");
    });
  }

  return app;
}
