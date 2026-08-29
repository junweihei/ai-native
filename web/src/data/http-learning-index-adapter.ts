import type {
  LearningIndexAdapter,
  LearningIndexAvailability,
  TodayWorkspaceSnapshot,
} from "../../shared/data-contract";

interface DataSourceResponse {
  contractVersion: string;
  index: LearningIndexAvailability;
}

export class HttpLearningIndexAdapter implements LearningIndexAdapter {
  constructor(private readonly endpoint = "/api/v1") {}

  async describe(): Promise<LearningIndexAvailability> {
    const response = await fetch(`${this.endpoint}/data-source`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok)
      return { availability: "unavailable", reason: "unreachable" };
    return ((await response.json()) as DataSourceResponse).index;
  }

  async getToday(): Promise<TodayWorkspaceSnapshot> {
    const response = await fetch(`${this.endpoint}/today`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error("today_index_unreachable");
    return (await response.json()) as TodayWorkspaceSnapshot;
  }
}
