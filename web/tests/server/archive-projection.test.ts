import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { GeneratedIndexLearningAdapter } from "../../server/data/generated-index-learning-adapter.js";

let root: string | undefined;
afterEach(async () => {
  if (root) await rm(root, { recursive: true, force: true });
  root = undefined;
});

describe("archive projection boundary", () => {
  it("combines active and archived Markdown records while excluding controlled content and raw previews", async () => {
    root = await mkdtemp(join(tmpdir(), "learning-os-archive-"));
    await Promise.all([
      mkdir(join(root, "config"), { recursive: true }),
      mkdir(join(root, "content", "practice"), { recursive: true }),
      mkdir(join(root, "web", "public", "data"), { recursive: true }),
    ]);
    await writeFile(
      join(root, "config", "learning-content.json"),
      JSON.stringify({
        generated_index: "web/public/data/learning-index.json",
        controlled_materials_manifest: "config/controlled-materials.json",
      }),
    );
    await writeFile(
      join(root, "config", "controlled-materials.json"),
      JSON.stringify({
        materials: [{ paths: ["content/practice/answer.md"] }],
      }),
    );
    await writeFile(join(root, "content", "practice", "answer.md"), "secret");
    await writeFile(
      join(root, "web", "public", "data", "learning-index.json"),
      JSON.stringify({
        schema_version: "V1.0",
        generated_at: "2026-08-31T00:00:00Z",
        source_revision: "sha256:test",
        freshness: { status: "fresh" },
        current_context: { task_id: "M01-D02" },
        documents: [
          {
            id: "safe",
            path: "content/evidence/safe.md",
            title: "Safe",
            type: "evidence",
            status: "verified",
            updated: "2026-08-31",
            task_id: "M01-D02",
            milestone: "M01",
            nodes: ["task-fit"],
            evidence_for: ["M01-C02"],
            summary: "must remain server-side",
          },
          {
            id: "secret",
            path: "content/practice/answer.md",
            title: "Secret answer",
            summary: "controlled secret",
          },
        ],
        archive_documents: [
          {
            id: "old",
            path: "archive/old.md",
            title: "Old version",
            type: "archive",
            status: "archived",
            updated: "2025-01-01",
          },
        ],
      }),
    );

    const result = (await new GeneratedIndexLearningAdapter(
      root,
    ).getArchive()) as {
      documents: Array<Record<string, unknown>>;
      currentTaskId: string | null;
    };
    expect(result.documents.map((item) => item.path)).toEqual([
      "content/evidence/safe.md",
      "archive/old.md",
    ]);
    expect(result).toMatchObject({ currentTaskId: "M01-D02" });
    expect(result.documents[0]).toMatchObject({
      task_id: "M01-D02",
      milestone: "M01",
      nodes: ["task-fit"],
    });
    expect(result.documents[0]).not.toHaveProperty("summary");
    expect(result.documents[1]).toMatchObject({ status: "archived" });
  });
});
