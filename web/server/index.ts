import { buildServer } from "./app.js";

const host = process.env.LEARNING_OS_HOST ?? "127.0.0.1";
const port = Number(process.env.LEARNING_OS_PORT ?? "4173");
const loopbackHosts = new Set(["127.0.0.1", "localhost", "::1"]);

if (!loopbackHosts.has(host)) {
  throw new Error("V1 仅允许绑定本机回环地址。请检查 LEARNING_OS_HOST。");
}

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("LEARNING_OS_PORT 必须是有效端口号。");
}

const app = await buildServer({
  serveStatic: process.env.NODE_ENV !== "development",
});

try {
  await app.listen({ host, port });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}
