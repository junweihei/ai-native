import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

async function tabTo(page: Page, target: Locator, limit = 80) {
  for (let index = 0; index < limit; index += 1) {
    await page.keyboard.press("Tab");
    if (await target.evaluate((element) => document.activeElement === element))
      return;
  }
  throw new Error("Keyboard focus did not reach the expected control");
}

const criticalPages = [
  "/today",
  "/tasks/M01-D02",
  "/review",
  "/roadmap",
  "/knowledge",
  "/archive",
];

test("critical pages have one H1 and no detectable WCAG 2.2 A/AA violations", async ({
  page,
}) => {
  test.setTimeout(120_000);
  for (const path of criticalPages) {
    await page.goto(path);
    await expect(page.locator("h1")).toHaveCount(1);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(result.violations, path).toEqual([]);
  }
});

test("P0 pages reflow at 320px and desktop-equivalent 200 percent zoom", async ({
  page,
}) => {
  for (const width of [320, 640]) {
    await page.setViewportSize({ width, height: 760 });
    for (const path of ["/today", "/tasks/M01-D02", "/review", "/archive"]) {
      await page.goto(path);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
      if (path === "/archive") {
        await expect(page.getByText(/当前显示 \d+ \/ \d+ 条/)).toBeVisible();
      }
      if (width === 640) {
        await page.evaluate(() => {
          document.documentElement.style.fontSize = "200%";
        });
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() => resolve()),
            ),
        );
      }
      const measurement = await page.evaluate(() => {
        const clientWidth = document.documentElement.clientWidth;
        const bounds = (selector: string) => {
          const rect = document
            .querySelector(selector)
            ?.getBoundingClientRect();
          return rect
            ? {
                left: Math.round(rect.left),
                right: Math.round(rect.right),
                width: Math.round(rect.width),
              }
            : null;
        };
        return {
          environment: {
            innerWidth: window.innerWidth,
            clientWidth,
            scrollWidth: document.documentElement.scrollWidth,
            htmlMinWidth: getComputedStyle(document.documentElement).minWidth,
            body: bounds("body"),
            workspace: bounds(".workspace"),
            paper: bounds(".paper"),
          },
          overflow: document.documentElement.scrollWidth > clientWidth,
          offenders: Array.from(
            document.querySelectorAll<HTMLElement>("body *"),
          )
            .filter((element) => {
              const rect = element.getBoundingClientRect();
              return rect.right > clientWidth + 1 || rect.left < -1;
            })
            .slice(0, 8)
            .map((element) => ({
              tag: element.tagName.toLowerCase(),
              className: element.className,
              text: element.textContent?.trim().slice(0, 80),
              right: Math.round(element.getBoundingClientRect().right),
              scrollWidth: element.scrollWidth,
              clientWidth: element.clientWidth,
            })),
        };
      });
      expect(
        measurement.overflow,
        path + " at " + width + "px offenders: " + JSON.stringify(measurement),
      ).toBe(false);
    }
  }
});
test("reduced motion removes functional animation without hiding information", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/today");
  await expect(page.getByRole("link", { name: "继续当前任务" })).toBeVisible();
  const durations = await page.evaluate(() => {
    const style = getComputedStyle(document.querySelector(".primary-action")!);
    return {
      animation: style.animationDuration,
      transition: style.transitionDuration,
    };
  });
  expect(Number.parseFloat(durations.animation)).toBeLessThanOrEqual(0.001);
  expect(Number.parseFloat(durations.transition)).toBeLessThanOrEqual(0.001);
});

test("archive views share one dataset, combine filters, retain archived state and handle a large result set", async ({
  page,
}) => {
  const documents = Array.from({ length: 250 }, (_, index) => ({
    id: `DOC-${index}`,
    path:
      index === 249
        ? "archive/history.md"
        : `content/evidence/item-${index}.md`,
    title: `Record ${index}`,
    type: index % 2 ? "artifact" : "evidence",
    status: index === 249 ? "archived" : index % 3 ? "completed" : "verified",
    updated: `2026-08-${String((index % 28) + 1).padStart(2, "0")}`,
    task_id: index % 2 ? "M01-D02" : "M01-D03",
    week: "M01-W01",
    milestone: "M01",
    nodes: [index % 2 ? "KN-01" : "KN-02"],
    evidence_for: index % 3 ? ["EV-1"] : [],
    capability_level: index % 2 ? "L2" : "L1",
    category: index === 249 ? "archive" : "evidence",
  }));
  await page.route("**/api/v1/archive", (route) =>
    route.fulfill({
      json: {
        documents,
        generatedAt: "2026-08-31T00:00:00Z",
        sourceRevision: "sha256:archive-test",
        freshness: { status: "fresh", reason: null },
      },
    }),
  );
  await page.goto("/archive");
  await expect(page.getByText("当前显示 250 / 250 条")).toBeVisible();
  await page.getByLabel("视图").selectOption("time");
  await expect(page.getByText("当前显示 250 / 250 条")).toBeVisible();
  await page.getByLabel("任务 ID").fill("M01-D02");
  await page.getByLabel("能力等级").selectOption("L2");
  await expect(page.getByText(/当前显示 125 \/ 250 条/)).toBeVisible();
  await page.getByRole("button", { name: "清空全部筛选" }).click();
  await expect(page.getByText("archive/history.md")).toBeVisible();
  await expect(page.getByText(/archive\/history.md.*archived/)).toBeVisible();
});

test("unknown statuses and partial roadmap relations remain visible", async ({
  page,
}) => {
  await page.route("**/api/v1/roadmap", (route) =>
    route.fulfill({
      json: {
        sourceRevision: "sha256:unknown",
        freshness: { status: "fresh", reason: null },
        currentTaskId: "M01-D99",
        relationIssues: [
          { code: "missing_parent", message: "关系缺失：父级不存在。" },
        ],
        months: [
          {
            id: "M01",
            title: "部分月份",
            capabilityRange: null,
            projectIncrement: null,
            acceptance: null,
            status: "future_state",
            partial: true,
            weeks: [],
          },
        ],
      },
    }),
  );
  await page.goto("/roadmap");
  await expect(page.getByText("状态未知")).toBeVisible();
  await expect(page.getByText("关系缺失：父级不存在。")).toBeVisible();
  await expect(page.getByText(/系统不补造任务/)).toBeVisible();
});

test("knowledge details use authority-backed four questions and preserve bidirectional trace navigation", async ({
  page,
}) => {
  await page.goto("/tasks/M01-D02");
  const nodeLink = page.getByRole("link", { name: "task-fit" });
  await tabTo(page, nodeLink);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/knowledge\/task-fit$/);

  await expect(page.getByRole("heading", { name: "是什么" })).toBeVisible();
  await expect(
    page.getByText(/根据任务确定性、输入结构、路径是否固定/),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "解决什么问题" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "何时使用或不用" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "怎样证明有效" }),
  ).toBeVisible();
  await expect(page.getByText(/运行状态：/)).toContainText("partial");
  await expect(page.getByText(/能力等级：目标 L2/)).toContainText(
    "当前评估 未评估",
  );
  await expect(
    page.getByText(/具体缺口：已关联证据尚未通过独立验证/),
  ).toBeVisible();

  const evidence = page.getByRole("link", { name: "D19 闭卷迁移题作答" });
  await evidence.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/archive\/EV-M01-D19-transfer$/);
  await expect(
    page.getByText("权威相对路径：content/evidence/迁移题作答.md"),
  ).toBeVisible();
  await expect(page.getByText(/只显示索引允许的元数据/)).toBeVisible();

  const reverseNode = page
    .getByRole("region", { name: "双向追溯关系" })
    .getByRole("link", { name: "task-fit" });
  await reverseNode.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/knowledge\/task-fit$/);

  await page.setViewportSize({ width: 320, height: 760 });
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});
test("keyboard alone completes today, artifact preview, session and review flow", async ({
  page,
}) => {
  const preview = {
    code: "preview_ready",
    message: "差异预览已生成；确认后才会写入。",
    intentId: "keyboard-intent",
    authoritativeChanged: false,
    taskStatusChanged: false,
    capabilityChanged: false,
    draftPreserved: true,
    recovery: ["copy", "repreview"],
    targets: [],
    sourceRevision: "sha256:keyboard",
  };
  await page.route("**/api/v1/writes/**", (route) =>
    route.fulfill({
      json: route.request().url().endsWith("/confirm")
        ? {
            ...preview,
            code: "committed",
            authoritativeChanged: true,
            draftPreserved: false,
          }
        : preview,
    }),
  );
  await page.goto("/today");
  const continueLink = page.getByRole("link", { name: "继续当前任务" });
  await tabTo(page, continueLink);
  await page.keyboard.press("Enter");

  const artifact = page.getByLabel("成果 Markdown 草稿");
  await tabTo(page, artifact);
  await page.keyboard.press("Control+A");
  await page.keyboard.insertText(
    "---\nid: KEYBOARD\ntype: artifact\ntask_id: M01-D02\nstatus: learning\nupdated: 2026-08-31\n---\n\n键盘成果",
  );
  const completion = page.getByRole("checkbox");
  await tabTo(page, completion);
  await page.keyboard.press("Space");
  const artifactPreview = page.getByRole("button", { name: "预览成果差异" });
  await tabTo(page, artifactPreview);
  await page.keyboard.press("Enter");
  const artifactConfirm = page.getByRole("button", { name: "确认写入成果" });
  await tabTo(page, artifactConfirm);
  await page.keyboard.press("Enter");
  const reviewLink = page.getByRole("link", { name: "结束会话并记录复盘" });
  await tabTo(page, reviewLink);
  await page.keyboard.press("Enter");

  const session = page.getByLabel("结束会话 Markdown 草稿");
  await tabTo(page, session);
  await page.keyboard.press("Control+A");
  await page.keyboard.insertText(
    "---\nid: S-KEYBOARD\ntype: session\nstatus: learning\ntask_id: M01-D02\nupdated: 2026-08-31\nproduces: content/knowledge/task.md\npassed_criteria: passed\nfailed_criteria: none\nunresolved_issue: follow up\ncapability_change_evidence_ids: EV-1\nnext_action: continue\ncurrent_step: close\n---",
  );
  const sessionPreview = page
    .getByRole("button", { name: "预览成果差异" })
    .first();
  await tabTo(page, sessionPreview);
  await page.keyboard.press("Enter");
  const sessionConfirm = page
    .getByRole("button", { name: "确认写入成果" })
    .first();
  await tabTo(page, sessionConfirm);
  await page.keyboard.press("Enter");

  const review = page.getByLabel("复盘 Markdown 草稿");
  await tabTo(page, review);
  await page.keyboard.press("Control+A");
  await page.keyboard.insertText(
    "---\nid: R-KEYBOARD\ntype: review\nstatus: draft\ntask_id: M01-D02\nreview_scope: daily\nupdated: 2026-08-31\nnext_action: continue\nadjustment: retain plan\n---",
  );
  const reviewPreview = page
    .getByRole("button", { name: "预览成果差异" })
    .last();
  await tabTo(page, reviewPreview);
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "确认写入成果" }),
  ).toBeVisible();
});

test("short offline failure preserves the draft and restores it after reconnect", async ({
  page,
  context,
}) => {
  await page.goto("/tasks/M01-D02");
  const draft = page.getByLabel("成果 Markdown 草稿");
  await draft.fill("短暂离线后恢复的草稿");
  await page.getByRole("checkbox").check();
  await context.setOffline(true);
  try {
    await page.getByRole("button", { name: "预览成果差异" }).click();
    await expect(page.getByRole("status")).toContainText("暂时不可用");
    await expect(draft).toHaveValue("短暂离线后恢复的草稿");
  } finally {
    await context.setOffline(false);
  }
  await page.reload();
  await expect(page.getByLabel("成果 Markdown 草稿")).toHaveValue(
    "短暂离线后恢复的草稿",
  );
});
