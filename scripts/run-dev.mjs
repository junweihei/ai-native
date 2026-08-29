import { spawn } from "node:child_process";
import { join } from "node:path";

const services = [
  {
    entry: join("node_modules", "tsx", "dist", "cli.mjs"),
    args: ["watch", "web/server/dev.ts"],
  },
  {
    entry: join("node_modules", "vite", "bin", "vite.js"),
    args: ["--host", "127.0.0.1", "--port", "5173"],
  },
];

const children = services.map(({ entry, args }) =>
  spawn(process.execPath, [entry, ...args], {
    stdio: "inherit",
    env: process.env,
  }),
);

let stopping = false;

function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode !== null || child.killed) continue;
    try {
      child.kill();
    } catch (error) {
      const code =
        error instanceof Error && "code" in error ? error.code : undefined;
      if (code !== "EPERM" && code !== "ESRCH") throw error;
    }
  }
  process.exitCode = exitCode;
}

for (const child of children) {
  child.on("error", () => stop(1));
  child.on("exit", (code, signal) => {
    if (!stopping && code !== 0 && signal === null) stop(code ?? 1);
  });
}

process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
