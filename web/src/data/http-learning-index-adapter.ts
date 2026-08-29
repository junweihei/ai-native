import type {
  LearningIndexAdapter,
  LearningIndexAvailability,
} from "../../shared/data-contract";

interface DataSourceResponse {
  contractVersion: string;
  index: LearningIndexAvailability;
}

export class HttpLearningIndexAdapter implements LearningIndexAdapter {
  constructor(private readonly endpoint = "/api/v1/data-source") {}

  async describe(): Promise<LearningIndexAvailability> {
    const response = await fetch(this.endpoint, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return { availability: "unavailable", reason: "unreachable" };
    }

    const body = (await response.json()) as DataSourceResponse;
    return body.index;
  }
}
