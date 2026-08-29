import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("app shell routes to the five primary entries", async ({ page }) => {
  await page.goto("/today");
  await expect(page.getByText("唯一可执行主任务 · M01-D02")).toBeVisible();

  await page.getByRole("link", { name: "复盘" }).click();
  await expect(page).toHaveURL(/\/review$/);
  await expect(page.getByRole("heading", { name: "复盘" })).toBeVisible();
});

test("today workbench has no automatically detectable WCAG A/AA violations", async ({
  page,
}) => {
  test.setTimeout(90_000);

  await page.goto("/today");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();

  expect(results.violations).toEqual([]);
});

test("narrow viewport keeps all primary navigation reachable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/today");

  for (const label of ["今日", "路线图", "知识地图", "学习档案", "复盘"]) {
    await expect(page.getByRole("link", { name: label })).toBeVisible();
  }
});
