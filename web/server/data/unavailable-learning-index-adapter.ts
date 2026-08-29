import type {
  LearningIndexAdapter,
  LearningIndexAvailability,
} from "../../shared/data-contract.js";

export class UnavailableLearningIndexAdapter implements LearningIndexAdapter {
  async describe(): Promise<LearningIndexAvailability> {
    return {
      availability: "unavailable",
      reason: "not-configured",
    };
  }
}
