import fastify, { type FastifyInstance } from "fastify";
import fastifyStatic from "@fastify/static";
import { join } from "node:path";
import type {
  LearningIndexAdapter,
  WritePreviewRequest,
} from "../shared/data-contract.js";
import { DATA_ACCESS_CONTRACT_VERSION } from "../shared/data-contract.js";
import {
  RepositoryControlledBroker,
  type ControlledBroker,
} from "./controlled-material-broker.js";
import { GeneratedIndexLearningAdapter } from "./data/generated-index-learning-adapter.js";
import { SafeWriteCoordinator } from "./safe-write-coordinator.js";

export interface BuildServerOptions {
  dataAdapter?: LearningIndexAdapter;
  controlledBroker?: ControlledBroker;
  writeCoordinator?: SafeWriteCoordinator;
  serveStatic?: boolean;
}

export async function buildServer(
  options: BuildServerOptions = {},
): Promise<FastifyInstance> {
  const app = fastify({ logger: false });
  const dataAdapter =
    options.dataAdapter ?? new GeneratedIndexLearningAdapter();
  const controlledBroker =
    options.controlledBroker ?? new RepositoryControlledBroker();
  const writeCoordinator =
    options.writeCoordinator ?? new SafeWriteCoordinator();

  app.addHook("onSend", async (_request, reply, payload) => {
    reply.header("X-Content-Type-Options", "nosniff");
    reply.header("Referrer-Policy", "no-referrer");
    reply.header("Cache-Control", "no-store");
    return payload;
  });

  app.get("/api/v1/health", async () => ({ ok: true }));
  app.get("/api/v1/data-source", async () => ({
    contractVersion: DATA_ACCESS_CONTRACT_VERSION,
    index: await dataAdapter.describe(),
  }));
  app.get("/api/v1/today", async (_request, reply) => {
    try {
      return await dataAdapter.getToday();
    } catch {
      return reply.code(503).send({ error: "today_index_unavailable" });
    }
  });
  app.get("/api/v1/archive", async (_request, reply) => {
    if (!dataAdapter.getArchive)
      return reply.code(503).send({ error: "archive_index_unavailable" });
    try {
      return await dataAdapter.getArchive();
    } catch {
      return reply.code(503).send({ error: "archive_index_unavailable" });
    }
  });
  app.get("/api/v1/knowledge", async (_request, reply) => {
    if (!dataAdapter.getKnowledge)
      return reply.code(503).send({ error: "knowledge_index_unavailable" });
    try {
      return await dataAdapter.getKnowledge();
    } catch {
      return reply.code(503).send({ error: "knowledge_index_unavailable" });
    }
  });
  app.get("/api/v1/roadmap", async (_request, reply) => {
    if (!dataAdapter.getRoadmap)
      return reply.code(503).send({ error: "roadmap_index_unavailable" });
    try {
      return await dataAdapter.getRoadmap();
    } catch {
      return reply.code(503).send({ error: "roadmap_index_unavailable" });
    }
  });
  app.post<{
    Body: { taskId?: string; sourceRevision?: string; content?: string };
  }>("/api/v1/drafts/first-version", async (request, reply) => {
    try {
      return await controlledBroker.registerFirstVersion({
        taskId: request.body.taskId ?? "",
        sourceRevision: request.body.sourceRevision ?? "",
        content: request.body.content ?? "",
      });
    } catch {
      return reply.code(400).send({ error: "first_version_rejected" });
    }
  });
  app.post<{
    Params: { controlId: string };
    Body: { taskId?: string; sourceRevision?: string; firstVersionId?: string };
  }>("/api/v1/controlled/:controlId/open", async (request, reply) => {
    try {
      return await controlledBroker.open({
        controlId: request.params.controlId,
        taskId: request.body.taskId ?? "",
        sourceRevision: request.body.sourceRevision ?? "",
        firstVersionId: request.body.firstVersionId ?? "",
      });
    } catch {
      return reply.code(503).send({
        decision: "locked",
        reason: "受控材料服务暂时不可用",
        decidedAt: new Date().toISOString(),
        items: [],
      });
    }
  });
  app.get("/api/v1/controlled/:controlId", async (_request, reply) =>
    reply.code(404).send({ error: "controlled_material_locked" }),
  );
  app.post<{ Body: WritePreviewRequest }>(
    "/api/v1/writes/preview",
    async (request) => writeCoordinator.preview(request.body),
  );
  app.post<{ Params: { intentId: string } }>(
    "/api/v1/writes/:intentId/confirm",
    async (request) => writeCoordinator.confirm(request.params.intentId),
  );

  if (options.serveStatic) {
    await app.register(fastifyStatic, {
      root: join(process.cwd(), "dist", "client"),
      wildcard: false,
    });
    app.setNotFoundHandler(async (request, reply) => {
      if (request.url.startsWith("/api/"))
        return reply.code(404).send({ error: "not_found" });
      return reply.sendFile("index.html");
    });
  }
  return app;
}
