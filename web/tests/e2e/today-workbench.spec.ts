import { expect, test } from "@playwright/test";
import { ambiguousToday, todayScenario } from "../fixtures/today-scenarios";

test("defaults to M01-D02 and continues from the recorded step with keyboard", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/today$/);
  const action = page.getByRole("link", { name: "继续当前任务" });
  await action.focus();
  await expect(action).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/tasks\/M01-D02\?resume=/);
  await expect(page.getByText(/任务工作台 · M01-D02/)).toBeVisible();
});

test("does not auto-select ambiguous tasks and blocks a stale index", async ({
  page,
}) => {
  await page.route("**/api/v1/today", (route) =>
    route.fulfill({ json: ambiguousToday }),
  );
  await page.goto("/today");
  await expect(
    page.getByRole("heading", { name: "发现多个候选任务" }),
  ).toBeVisible();
  await page.unroute("**/api/v1/today");

  const stale = todayScenario();
  stale.freshness = { status: "stale", reason: "来源内容晚于索引" };
  await page.route("**/api/v1/today", (route) =>
    route.fulfill({ json: stale }),
  );
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("索引已过期");
  await expect(
    page.getByRole("button", { name: "继续当前任务" }),
  ).toBeDisabled();
});

test("keeps the task hierarchy and action usable at 320px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/today");
  await expect(
    page.getByRole("list", { name: "月周日与上层目标位置" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "继续当前任务" })).toBeVisible();
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});
test("moves from today through task, session and review confirmation without losing drafts", async ({
  page,
}) => {
  const preview = {
    code: "preview_ready",
    message: "差异预览已生成；确认后才会写入。",
    intentId: "intent-1",
    authoritativeChanged: false,
    taskStatusChanged: false,
    capabilityChanged: false,
    draftPreserved: true,
    recovery: ["copy", "repreview"],
    targets: [],
    sourceRevision: "sha256:test",
  };
  const committed = {
    ...preview,
    code: "committed",
    message: "成果已写入并重建索引。",
    authoritativeChanged: true,
    draftPreserved: false,
    recovery: [],
  };
  await page.route("**/api/v1/writes/**", async (route) => {
    await route.fulfill({
      json: route.request().url().endsWith("/confirm") ? committed : preview,
    });
  });
  await page.goto("/today");
  await page.getByRole("link", { name: "继续当前任务" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "预览成果差异" }).click();
  await expect(
    page.getByRole("button", { name: "确认写入成果" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "确认写入成果" }).click();
  await expect(page.getByRole("status")).toContainText("成果已写入");
  await page.getByRole("link", { name: "结束会话并记录复盘" }).click();
  await expect(
    page.getByRole("heading", { name: "记录续接点，而非猜测完成" }),
  ).toBeVisible();
  await page
    .getByLabel("结束会话 Markdown 草稿")
    .fill(
      [
        "---",
        "id: S-E2E",
        "type: session",
        "status: completed",
        "task_id: M01-D02",
        "updated: 2026-08-30",
        "produces: content/knowledge/task.md",
        "passed_criteria: passed",
        "failed_criteria: none",
        "unresolved_issue: follow up",
        "capability_change_evidence_ids: EV-1",
        "next_action: continue",
        "current_step: close",
        "---",
      ].join("\n"),
    );
  await page.getByRole("button", { name: "预览成果差异" }).first().click();
  await page.getByRole("button", { name: "确认写入成果" }).click();
  await page
    .getByLabel("复盘 Markdown 草稿")
    .fill(
      [
        "---",
        "id: R-E2E",
        "type: review",
        "status: draft",
        "task_id: M01-D02",
        "review_scope: daily",
        "updated: 2026-08-30",
        "next_action: continue",
        "adjustment: retain plan",
        "---",
      ].join("\n"),
    );
  await page.getByRole("button", { name: "预览成果差异" }).last().click();
  await expect(
    page.getByRole("button", { name: "确认写入成果" }),
  ).toBeVisible();
});
test("restores unsaved task and review drafts after reload without changing authority", async ({
  page,
}) => {
  await page.goto("/today");
  await page.getByRole("link", { name: "继续当前任务" }).click();
  const artifact = page.getByLabel("成果 Markdown 草稿");
  await artifact.fill(
    "---\nid: RECOVERY\ntype: artifact\ntask_id: M01-D02\nstatus: learning\nupdated: 2026-08-31\n---\n\n未提交恢复内容",
  );
  await page.getByRole("checkbox").check();
  await page.reload();
  await expect(page.getByLabel("成果 Markdown 草稿")).toHaveValue(
    /未提交恢复内容/,
  );
  await expect(page.getByRole("checkbox")).toBeChecked();

  await page.getByRole("link", { name: "结束会话并记录复盘" }).click();
  await page.getByLabel("结束会话 Markdown 草稿").fill("未提交会话草稿");
  await page.getByLabel("复盘 Markdown 草稿").fill("未提交复盘草稿");
  await page.reload();
  await expect(page.getByLabel("结束会话 Markdown 草稿")).toHaveValue(
    "未提交会话草稿",
  );
  await expect(page.getByLabel("复盘 Markdown 草稿")).toHaveValue(
    "未提交复盘草稿",
  );
});

test("keeps controlled answers out of the public index and opens them only after first-version registration", async ({
  page,
  request,
}) => {
  const indexResponse = await request.get("/data/learning-index.json");
  const publicIndex = await indexResponse.text();
  expect(publicIndex).not.toContain("20题首测_参考答案.md");
  expect(publicIndex).not.toContain("核心判定依据");

  const controlledToday = todayScenario();
  controlledToday.access = { mode: "read-write", reason: null, recovery: null };
  if (controlledToday.context?.resolution === "resolved") {
    controlledToday.context.task.controlled_materials = [
      {
        control_id: "test-answer",
        safe_category: "验收参考答案",
        condition: "登记首次独立版本后开放",
        access_state: "locked",
      },
    ];
  }
  await page.route("**/api/v1/today", (route) =>
    route.fulfill({ json: controlledToday }),
  );
  await page.route("**/api/v1/drafts/first-version", (route) =>
    route.fulfill({
      json: {
        versionId: "first-1",
        recordedAt: "2026-08-31T00:00:00Z",
        contentHash: "hash",
      },
    }),
  );
  await page.route("**/api/v1/controlled/test-answer/open", (route) =>
    route.fulfill({
      json: {
        decision: "available",
        reason: "开放条件已验证",
        decidedAt: "2026-08-31T00:00:01Z",
        items: [{ label: "参考答案 1", content: "受控秘密答案" }],
      },
    }),
  );
  await page.goto("/tasks/M01-D02");
  await expect(page.getByText("受控秘密答案")).toHaveCount(0);
  await page.getByRole("button", { name: "登记首次版本并检查开放" }).click();
  await page.getByText("参考答案 1（首次版本之后开放）").click();
  await expect(page.getByText("受控秘密答案")).toBeVisible();
});
test("preserves and exposes recovery actions after permission failure", async ({
  page,
}) => {
  await page.route("**/api/v1/writes/preview", (route) =>
    route.fulfill({
      json: {
        code: "permission_denied",
        message: "权限不足，权威文件未改变；请修复目录权限后重试。",
        intentId: null,
        authoritativeChanged: false,
        taskStatusChanged: false,
        capabilityChanged: false,
        draftPreserved: true,
        recovery: ["copy", "retry", "reload"],
        targets: [],
        sourceRevision: null,
      },
    }),
  );
  await page.goto("/tasks/M01-D02");
  const draft = page.getByLabel("成果 Markdown 草稿");
  await draft.fill("权限失败后必须恢复的草稿");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "预览成果差异" }).click();
  await expect(page.getByRole("status")).toContainText("权威文件未改变");
  await expect(
    page.getByRole("button", { name: "复制当前草稿" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("成果 Markdown 草稿")).toHaveValue(
    "权限失败后必须恢复的草稿",
  );
});
test("shows blocked task recovery conditions and records blocked without completing", async ({
  page,
}) => {
  const blocked = todayScenario("M01-D04");
  blocked.access = { mode: "read-write", reason: null, recovery: null };
  await page.route("**/api/v1/today", (route) =>
    route.fulfill({ json: blocked }),
  );
  await page.goto("/today");
  await page.getByRole("link", { name: "查看阻塞与解除条件" }).click();
  await expect(
    page.getByRole("heading", { name: "任务已阻塞，不计入完成" }),
  ).toBeVisible();
  await expect(page.getByText(/解除条件.*M01-D03/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "预览成果差异" }),
  ).toBeDisabled();
  await page.getByRole("link", { name: "记录阻塞和续接点" }).click();
  await page.getByLabel("会话后任务状态").selectOption("blocked");
  await expect(page.getByText(/blocked 记录必须填写/)).toBeVisible();
});
test("shows the authoritative roadmap as a keyboard-accessible responsive hierarchy", async ({
  page,
}) => {
  await page.route("**/api/v1/roadmap", (route) =>
    route.fulfill({
      json: {
        sourceRevision: "sha256:test",
        freshness: { status: "fresh", reason: null },
        currentTaskId: "M01-D02",
        relationIssues: [
          { code: "missing_parent", message: "M01-D03 依赖不存在任务。" },
        ],
        months: [
          {
            id: "M01",
            title: "整体认知",
            capabilityRange: "L1—L2",
            projectIncrement: "V0",
            acceptance: "月末证据",
            status: "learning",
            partial: false,
            weeks: [
              {
                id: "M01-W01",
                title: "第1周：图",
                gate: "通过口头关卡",
                tasks: [
                  {
                    id: "M01-D02",
                    title: "任务判断",
                    timeRange: "60 分钟",
                    status: "verified",
                    dependencies: ["M01-D01"],
                    gate: null,
                    acceptance: "有理由",
                    blockedReason: null,
                    unlockCondition: null,
                    current: true,
                    relationIssues: [],
                  },
                ],
              },
            ],
          },
          {
            id: "M02",
            title: "模型应用",
            capabilityRange: "L2",
            projectIncrement: "V1",
            acceptance: "样例",
            status: "not_started",
            partial: true,
            weeks: [],
          },
        ],
      },
    }),
  );
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/roadmap");
  await expect(
    page.getByRole("heading", { name: "当前路径与阶段门禁" }),
  ).toBeVisible();
  await expect(page.getByText("M01-D03 依赖不存在任务。")).toBeVisible();
  await expect(
    page.getByText("该月尚未提供周/日权威执行计划；系统不补造任务。"),
  ).toBeVisible();
  const detail = page.getByRole("link", { name: "进入任务详情" });
  await detail.focus();
  await expect(detail).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/tasks\/M01-D02$/);
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});
