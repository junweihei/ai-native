import type {
  LearningIndexAdapter,
  LearningIndexAvailability,
  TodayWorkspaceSnapshot,
} from "../../shared/data-contract";
import { todayScenario } from "./today-scenarios";

export class TestLearningIndexAdapter implements LearningIndexAdapter {
  constructor(
    private readonly result: LearningIndexAvailability = {
      availability: "ready",
      schemaVersion: "test-only",
      generatedAt: "2000-01-01T00:00:00.000Z",
      sourceRevision: "test-fixture",
    },
    private readonly todayResult: TodayWorkspaceSnapshot = todayScenario(),
  ) {}
  async describe(): Promise<LearningIndexAvailability> {
    return this.result;
  }
  async getToday(): Promise<TodayWorkspaceSnapshot> {
    return this.todayResult;
  }
}
