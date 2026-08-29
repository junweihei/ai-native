import { readFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import type {
  LearningIndexAdapter,
  LearningIndexAvailability,
  TodayContext,
  TodayWorkspaceSnapshot,
} from "../../shared/data-contract.js";

interface GeneratedIndex {
  schema_version?: unknown;
  generated_at?: unknown;
  source_of_truth?: unknown;
  source_revision?: unknown;
  freshness?: { status?: unknown; reason?: unknown };
  current_context?: unknown;
}

export class GeneratedIndexLearningAdapter implements LearningIndexAdapter {
  constructor(private readonly repoRoot = process.cwd()) {}

  private async load(): Promise<{ raw: GeneratedIndex; indexPath: string }> {
    const configPath = resolve(this.repoRoot, "config/learning-content.json");
    const config = JSON.parse(await readFile(configPath, "utf8")) as {
      generated_index?: unknown;
    };
    if (typeof config.generated_index !== "string") {
      throw new Error("generated_index_not_configured");
    }
    const indexPath = resolve(this.repoRoot, config.generated_index);
    const relativePath = relative(this.repoRoot, indexPath);
    if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
      throw new Error("generated_index_outside_repository");
    }
    return {
      raw: JSON.parse(await readFile(indexPath, "utf8")) as GeneratedIndex,
      indexPath: config.generated_index.replaceAll("\\", "/"),
    };
  }

  async describe(): Promise<LearningIndexAvailability> {
    try {
      const { raw } = await this.load();
      if (
        typeof raw.schema_version !== "string" ||
        typeof raw.generated_at !== "string"
      ) {
        return { availability: "unavailable", reason: "invalid" };
      }
      return {
        availability: "ready",
        schemaVersion: raw.schema_version,
        generatedAt: raw.generated_at,
        sourceRevision:
          typeof raw.source_revision === "string" ? raw.source_revision : null,
      };
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      return {
        availability: "unavailable",
        reason: code.includes("not_configured")
          ? "not-configured"
          : code.includes("ENOENT")
            ? "not-generated"
            : "invalid",
      };
    }
  }

  async getToday(): Promise<TodayWorkspaceSnapshot> {
    const { raw, indexPath } = await this.load();
    if (
      typeof raw.schema_version !== "string" ||
      typeof raw.generated_at !== "string" ||
      raw.source_of_truth !== "markdown"
    ) {
      throw new Error("invalid_generated_index");
    }
    const freshnessStatus = raw.freshness?.status;
    return {
      schemaVersion: raw.schema_version,
      generatedAt: raw.generated_at,
      source: {
        authority: "markdown",
        revision:
          typeof raw.source_revision === "string" ? raw.source_revision : null,
        indexPath,
      },
      freshness: {
        status:
          freshnessStatus === "fresh" || freshnessStatus === "stale"
            ? freshnessStatus
            : "unknown",
        reason:
          typeof raw.freshness?.reason === "string"
            ? raw.freshness.reason
            : null,
      },
      access: {
        mode: "read-only",
        reason: "安全写回契约尚未实施，当前只读取生成索引。",
        recovery: "完成安全写回评审与实现后，才可启用状态写回。",
      },
      context:
        raw.current_context && typeof raw.current_context === "object"
          ? (raw.current_context as TodayContext)
          : null,
    };
  }
}
