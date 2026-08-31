import { glob, readFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import type {
  LearningIndexAdapter,
  LearningIndexAvailability,
  TodayContext,
  TodayWorkspaceSnapshot,
  RoadmapSnapshot,
} from "../../shared/data-contract.js";

interface GeneratedIndex {
  schema_version?: unknown;
  generated_at?: unknown;
  source_of_truth?: unknown;
  source_revision?: unknown;
  freshness?: { status?: unknown; reason?: unknown };
  current_context?: unknown;
  roadmap?: unknown;
  knowledge?: unknown;
  documents?: unknown;
  archive_documents?: unknown;
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

  private async protectedPaths(): Promise<Set<string>> {
    const config = JSON.parse(
      await readFile(
        resolve(this.repoRoot, "config/learning-content.json"),
        "utf8",
      ),
    ) as { controlled_materials_manifest?: unknown };
    if (typeof config.controlled_materials_manifest !== "string")
      return new Set();
    const manifest = JSON.parse(
      await readFile(
        resolve(this.repoRoot, config.controlled_materials_manifest),
        "utf8",
      ),
    ) as { materials?: Array<{ paths?: string[] }> };
    const protectedPaths = new Set<string>();
    for (const material of manifest.materials ?? []) {
      for (const pattern of material.paths ?? []) {
        for await (const match of glob(pattern, { cwd: this.repoRoot })) {
          protectedPaths.add(match.replaceAll("\\", "/"));
        }
      }
    }
    return protectedPaths;
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
        mode: "read-write",
        reason: "写回需先生成差异预览并经用户确认。",
        recovery: "发生冲突或失败时保留草稿，并重新加载后预览。",
      },
      context:
        raw.current_context && typeof raw.current_context === "object"
          ? (raw.current_context as TodayContext)
          : null,
    };
  }

  async getRoadmap(): Promise<RoadmapSnapshot> {
    const { raw } = await this.load();
    if (!raw.roadmap || typeof raw.roadmap !== "object")
      throw new Error("roadmap_not_generated");
    return {
      ...(raw.roadmap as Omit<RoadmapSnapshot, "sourceRevision" | "freshness">),
      sourceRevision:
        typeof raw.source_revision === "string" ? raw.source_revision : null,
      freshness: {
        status:
          raw.freshness?.status === "fresh" || raw.freshness?.status === "stale"
            ? raw.freshness.status
            : "unknown",
        reason:
          typeof raw.freshness?.reason === "string"
            ? raw.freshness.reason
            : null,
      },
    };
  }

  async getKnowledge(): Promise<unknown> {
    const { raw } = await this.load();
    if (!raw.knowledge || typeof raw.knowledge !== "object")
      throw new Error("knowledge_not_generated");
    return raw.knowledge;
  }

  async getArchive(): Promise<unknown> {
    const { raw } = await this.load();
    if (!Array.isArray(raw.documents)) throw new Error("archive_not_generated");
    const protectedPaths = await this.protectedPaths();
    const candidates = [
      ...raw.documents,
      ...(Array.isArray(raw.archive_documents) ? raw.archive_documents : []),
    ];
    const documents = candidates
      .filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) &&
          typeof item === "object" &&
          typeof (item as Record<string, unknown>).path === "string" &&
          !protectedPaths.has((item as Record<string, unknown>).path as string),
      )
      .map((item) => ({
        id: item.id,
        path: item.path,
        title: item.title,
        type: item.type,
        status: item.status,
        updated: item.updated,
        task_id: item.task_id,
        week: item.week,
        milestone: item.milestone,
        nodes: item.nodes,
        evidence_for: item.evidence_for,
        category: item.category,
        capability_level: item.capability_level,
      }));
    return {
      documents,
      currentTaskId:
        raw.current_context && typeof raw.current_context === "object"
          ? ((raw.current_context as Record<string, unknown>).task_id ?? null)
          : null,
      generatedAt: raw.generated_at,
      sourceRevision:
        typeof raw.source_revision === "string" ? raw.source_revision : null,
      freshness: raw.freshness ?? { status: "unknown", reason: null },
    };
  }
}
