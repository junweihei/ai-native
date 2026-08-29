import { describe, expect, it } from "vitest";
import {
  resumeHref,
  todayActionEnabled,
  todayActionLabel,
} from "../../src/pages/today-workspace-model";
import { ambiguousToday, todayScenario } from "../fixtures/today-scenarios";

describe("today workspace decision model", () => {
  it("uses start for M01-D01 and continue with a resume point for M01-D02", () => {
    expect(todayActionLabel(todayScenario("M01-D01"))).toBe("开始当前任务");
    const d02 = todayScenario("M01-D02");
    expect(todayActionLabel(d02)).toBe("继续当前任务");
    expect(resumeHref(d02)).toContain(
      "/tasks/M01-D02?resume=D2+%E8%AF%81%E6%8D%AE%E8%A1%A5%E9%93%BE",
    );
  });

  it("blocks M01-D04, ambiguous selection, and stale indexes", () => {
    expect(todayActionEnabled(todayScenario("M01-D04"))).toBe(false);
    expect(todayActionEnabled(ambiguousToday)).toBe(false);
    const stale = todayScenario();
    stale.freshness = { status: "stale", reason: "source changed" };
    expect(todayActionEnabled(stale)).toBe(false);
  });
});
