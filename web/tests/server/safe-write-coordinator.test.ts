import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  SafeWriteCoordinator,
  classifyWriteFailure,
} from "../../server/safe-write-coordinator.js";
import { RepositoryControlledBroker } from "../../server/controlled-material-broker.js";

const taskId = "M01-D02";
const sourceRevision = "sha256:index";
const artifactPath = "content/knowledge/task.md";
const artifact = [
  "---",
  "id: ART-1",
  "type: artifact",
  "task_id: M01-D02",
  "status: learning",
  "updated: 2026-08-30",
  "---",
  "",
  "old body",
  "",
].join("\n");
const replacement = artifact.replace("old body", "new body");

function hash(value: string) {
  return "sha256:" + createHash("sha256").update(value).digest("hex");
}

let root: string | undefined;
afterEach(async () => {
  if (root) await rm(root, { recursive: true, force: true });
  root = undefined;
});

async function fixture() {
  root = await mkdtemp(join(tmpdir(), "learning-os-write-"));
  await Promise.all([
    mkdir(join(root, "config"), { recursive: true }),
    mkdir(join(root, "content", "knowledge"), { recursive: true }),
    mkdir(join(root, "content", "plans"), { recursive: true }),
    mkdir(join(root, "content", "sessions"), { recursive: true }),
    mkdir(join(root, "content", "evidence"), { recursive: true }),
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
      materials: [
        { control_id: "protected", paths: ["content/knowledge/protected.md"] },
      ],
    }),
  );
  await writeFile(join(root, "content", "knowledge", "task.md"), artifact);
  await writeFile(join(root, "content", "knowledge", "protected.md"), artifact);
  await writeFile(
    join(root, "content", "plans", "mapping.md"),
    ["---", "current_status: learning", "---", ""].join("\n"),
  );
  await writeFile(
    join(root, "web", "public", "data", "learning-index.json"),
    JSON.stringify({
      source_revision: sourceRevision,
      freshness: { status: "fresh" },
      current_context: {
        resolution: "resolved",
        source_path: "content/plans/mapping.md",
        task: {
          primary_artifacts: [artifactPath],
          completion_rules: ["rule one"],
          evidence_requirements: ["independent evidence"],
        },
      },
    }),
  );
}

function request(
  path = artifactPath,
  baseRevision: string | null = hash(artifact),
) {
  return {
    taskId,
    sourceRevision,
    targets: [
      {
        objectType: "artifact" as const,
        path,
        content: replacement,
        baseRevision,
      },
    ],
    completionChecks: ["rule one"],
    requestedTaskStatus: "completed" as const,
  };
}

describe("safe write coordinator", () => {
  it("classifies permission failures separately from temporary write failures", () => {
    expect(classifyWriteFailure({ code: "EACCES" })).toBe("permission_denied");
    expect(classifyWriteFailure({ code: "EPERM" })).toBe("permission_denied");
    expect(classifyWriteFailure({ code: "ENOENT" })).toBe("write_failed");
  });
  it("rejects path traversal, protected files, and stale target revisions without changing authority", async () => {
    await fixture();
    const coordinator = new SafeWriteCoordinator({
      repoRoot: root,
      rebuildIndex: async () => {},
    });
    expect((await coordinator.preview(request("../outside.md"))).code).toBe(
      "path_forbidden",
    );
    expect(
      (await coordinator.preview(request("content/knowledge/protected.md")))
        .code,
    ).toBe("path_forbidden");
    expect(
      (await coordinator.preview(request(artifactPath, "sha256:stale"))).code,
    ).toBe("conflict");
    expect(await readFile(join(root!, artifactPath), "utf8")).toBe(artifact);
  });

  it("writes only after confirmation and updates completed only after all rules", async () => {
    await fixture();
    const coordinator = new SafeWriteCoordinator({
      repoRoot: root,
      rebuildIndex: async () => {},
    });
    const invalid = await coordinator.preview({
      ...request(),
      completionChecks: [],
    });
    expect(invalid.code).toBe("validation_failed");
    const preview = await coordinator.preview(request());
    expect(preview.code).toBe("preview_ready");
    expect(await readFile(join(root!, artifactPath), "utf8")).toBe(artifact);
    const committed = await coordinator.confirm(preview.intentId!);
    expect(committed.code).toBe("committed");
    expect(committed.taskStatusChanged).toBe(true);
    expect(await readFile(join(root!, artifactPath), "utf8")).toBe(replacement);
  });

  it("preserves drafts through expired confirmations and index rebuild failure", async () => {
    await fixture();
    const expiring = new SafeWriteCoordinator({
      repoRoot: root,
      now: () => 0,
      rebuildIndex: async () => {},
    });
    const preview = await expiring.preview(request());
    const expired = await new SafeWriteCoordinator({
      repoRoot: root,
      now: () => 11 * 60 * 1000,
      rebuildIndex: async () => {},
    }).confirm(preview.intentId!);
    expect(expired.code).toBe("confirmation_expired");

    const failing = new SafeWriteCoordinator({
      repoRoot: root,
      rebuildIndex: async () => {
        throw new Error("index unavailable");
      },
    });
    const retryPreview = await failing.preview(request());
    const result = await failing.confirm(retryPreview.intentId!);
    expect(result.code).toBe("committed_index_stale");
    expect(result.authoritativeChanged).toBe(true);
    expect(result.draftPreserved).toBe(true);
  });
  it("does not overwrite a concurrently changed task mapping", async () => {
    await fixture();
    const coordinator = new SafeWriteCoordinator({
      repoRoot: root,
      rebuildIndex: async () => {},
    });
    const preview = await coordinator.preview(request());
    await writeFile(
      join(root!, "content", "plans", "mapping.md"),
      ["---", "current_status: blocked", "---", ""].join("\n"),
    );
    const result = await coordinator.confirm(preview.intentId!);
    expect(result.code).toBe("conflict");
    expect(result.authoritativeChanged).toBe(false);
    expect(result.draftPreserved).toBe(true);
    expect(await readFile(join(root!, artifactPath), "utf8")).toBe(artifact);
  });
  it("keeps unregistered controlled materials locked when the manifest is empty", async () => {
    await fixture();
    await writeFile(
      join(root!, "config", "controlled-materials.json"),
      JSON.stringify({ schema_version: "V1.0", materials: [] }),
    );
    const broker = new RepositoryControlledBroker(root);
    const first = await broker.registerFirstVersion({
      taskId,
      sourceRevision,
      content: "independent first version",
    });
    const result = await broker.open({
      controlId: "not-registered",
      taskId,
      sourceRevision,
      firstVersionId: first.versionId,
    });
    expect(result.decision).toBe("locked");
    expect(result.items).toEqual([]);
  });
  it("keeps incomplete sessions and reviews as drafts, then writes valid continuation records after confirmation", async () => {
    await fixture();
    const coordinator = new SafeWriteCoordinator({
      repoRoot: root,
      rebuildIndex: async () => {},
    });
    const session = [
      "---",
      "id: S-1",
      "type: session",
      "status: completed",
      `task_id: ${taskId}`,
      "updated: 2026-08-30",
      "produces: content/knowledge/task.md",
      "passed_criteria: rule one",
      "failed_criteria: none",
      "unresolved_issue: verify transfer",
      "capability_change_evidence_ids: EV-1",
      "next_action: continue closed book",
      "current_step: closed_book_first_pass",
      "---",
      "",
    ].join("\n");
    const invalidSession = await coordinator.preview({
      ...request(),
      targets: [
        {
          objectType: "session",
          path: "content/sessions/M01-D02-session.md",
          content: session.replace("EV-1", "[]"),
          baseRevision: null,
        },
      ],
      requestedTaskStatus: "learning",
    });
    expect(invalidSession.code).toBe("validation_failed");
    const sessionPreview = await coordinator.preview({
      ...request(),
      targets: [
        {
          objectType: "session",
          path: "content/sessions/M01-D02-session.md",
          content: session,
          baseRevision: null,
        },
      ],
      requestedTaskStatus: "learning",
    });
    expect(sessionPreview.code).toBe("preview_ready");
    expect(await coordinator.confirm(sessionPreview.intentId!)).toMatchObject({
      code: "committed",
      taskStatusChanged: false,
    });
    expect(
      await readFile(
        join(root!, "content", "sessions", "M01-D02-session.md"),
        "utf8",
      ),
    ).toBe(session);

    const weekly = [
      "---",
      "id: R-1",
      "type: review",
      "status: draft",
      `task_id: ${taskId}`,
      "review_scope: weekly",
      "updated: 2026-08-30",
      "next_action: continue",
      "adjustment: practice",
      "---",
      "",
    ].join("\n");
    expect(
      (
        await coordinator.preview({
          ...request(),
          targets: [
            {
              objectType: "review",
              path: "content/evidence/M01-D02-weekly-review.md",
              content: weekly,
              baseRevision: null,
            },
          ],
          requestedTaskStatus: undefined,
        })
      ).code,
    ).toBe("validation_failed");
    const daily = weekly.replace("review_scope: weekly", "review_scope: daily");
    const reviewPreview = await coordinator.preview({
      ...request(),
      targets: [
        {
          objectType: "review",
          path: "content/evidence/M01-D02-daily-review.md",
          content: daily,
          baseRevision: null,
        },
      ],
      requestedTaskStatus: undefined,
    });
    expect(reviewPreview.code).toBe("preview_ready");
    expect(await coordinator.confirm(reviewPreview.intentId!)).toMatchObject({
      code: "committed",
      taskStatusChanged: false,
    });
  });
  it("requires an unblock condition and safe degraded path before recording blocked", async () => {
    await fixture();
    const coordinator = new SafeWriteCoordinator({
      repoRoot: root,
      rebuildIndex: async () => {},
    });
    const blockedSession = [
      "---",
      "id: S-BLOCKED",
      "type: session",
      "status: learning",
      `task_id: ${taskId}`,
      "updated: 2026-08-31",
      "produces: content/knowledge/task.md",
      "passed_criteria: none",
      "failed_criteria: dependency",
      "unresolved_issue: missing permission",
      "capability_change_evidence_ids: EV-1",
      "next_action: request access",
      "current_step: specified_input",
      "blocker_type: permission",
      "unlock_condition: repository access restored",
      "degraded_path: preserve draft and inspect public inputs",
      "safe_action: request access without changing authority",
      "---",
      "",
    ].join("\n");
    const target = {
      objectType: "session" as const,
      path: "content/sessions/M01-D02-blocked.md",
      content: blockedSession,
      baseRevision: null,
    };
    const invalid = await coordinator.preview({
      ...request(),
      targets: [
        {
          ...target,
          content: blockedSession.replace(
            "unlock_condition: repository access restored",
            "unlock_condition: ",
          ),
        },
      ],
      requestedTaskStatus: "blocked",
    });
    expect(invalid.code).toBe("validation_failed");
    const preview = await coordinator.preview({
      ...request(),
      targets: [target],
      requestedTaskStatus: "blocked",
    });
    expect(preview.code).toBe("preview_ready");
    expect(await coordinator.confirm(preview.intentId!)).toMatchObject({
      code: "committed",
      taskStatusChanged: true,
      capabilityChanged: false,
    });
  });
});
