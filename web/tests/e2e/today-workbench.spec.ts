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
  await expect(page.getByText(/续接步骤 D2 证据补链/)).toBeVisible();
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
