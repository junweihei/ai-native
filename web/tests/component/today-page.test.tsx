import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TodayWorkbenchView } from "../../src/pages/today-page";
import { ambiguousToday, todayScenario } from "../fixtures/today-scenarios";

afterEach(cleanup);

function renderToday(snapshot = todayScenario()) {
  return render(
    <MemoryRouter>
      <TodayWorkbenchView snapshot={snapshot} />
    </MemoryRouter>,
  );
}

describe("TodayWorkbenchView", () => {
  it("presents the P0 task context and exactly one main action", () => {
    renderToday();
    expect(
      screen.getByRole("heading", { name: "证据补链" }),
    ).toBeInTheDocument();
    expect(screen.getByText("原 75 分钟；补链 30—45 分钟")).toBeInTheDocument();
    expect(screen.getByText(/M01-C02/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "继续当前任务" })).toHaveAttribute(
      "href",
      expect.stringContaining("/tasks/M01-D02"),
    );
    expect(
      screen.getByRole("heading", { name: "完成条件" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "主要成果" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "证据" })).toBeInTheDocument();
    expect(screen.queryByText(/知识总量|打卡|文件数/)).not.toBeInTheDocument();
  });

  it("does not choose between multiple candidates", () => {
    renderToday(ambiguousToday);
    expect(
      screen.getByRole("heading", { name: "发现多个候选任务" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /当前任务/ }),
    ).not.toBeInTheDocument();
  });

  it("shows loading, error, stale, blocked and partial relations without defaults", () => {
    const { rerender } = render(
      <MemoryRouter>
        <TodayWorkbenchView snapshot={null} loading />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { name: "正在读取今日任务" }),
    ).toBeInTheDocument();
    rerender(
      <MemoryRouter>
        <TodayWorkbenchView snapshot={null} error onRefresh={vi.fn()} />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("button", { name: "重试读取" }),
    ).toBeInTheDocument();
    const stale = todayScenario();
    stale.freshness = { status: "stale", reason: "来源更新" };
    stale.context!.issues = [
      {
        code: "goal_relation_missing",
        message: "关系缺失：六个月目标",
        impact: "目标追溯不完整。",
      },
    ];
    rerender(
      <MemoryRouter>
        <TodayWorkbenchView snapshot={stale} />
      </MemoryRouter>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("索引已过期");
    expect(screen.getByText("关系缺失：六个月目标")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "继续当前任务" })).toBeDisabled();
    rerender(
      <MemoryRouter>
        <TodayWorkbenchView snapshot={todayScenario("M01-D04")} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/M01-D03/)).toBeInTheDocument();
  });
});
