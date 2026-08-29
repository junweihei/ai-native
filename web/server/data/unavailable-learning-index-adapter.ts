import type {
  LearningIndexAdapter,
  LearningIndexAvailability,
  TodayWorkspaceSnapshot,
} from "../../shared/data-contract.js";

export class UnavailableLearningIndexAdapter implements LearningIndexAdapter {
  async describe(): Promise<LearningIndexAvailability> {
    return { availability: "unavailable", reason: "not-configured" };
  }

  async getToday(): Promise<TodayWorkspaceSnapshot> {
    throw new Error("learning_index_unavailable");
  }
}
