import type {
  LearningIndexAdapter,
  LearningIndexAvailability,
} from "../../shared/data-contract";

export class TestLearningIndexAdapter implements LearningIndexAdapter {
  constructor(
    private readonly result: LearningIndexAvailability = {
      availability: "ready",
      schemaVersion: "test-only",
      generatedAt: "2000-01-01T00:00:00.000Z",
      sourceRevision: "test-fixture",
    },
  ) {}

  async describe(): Promise<LearningIndexAvailability> {
    return this.result;
  }
}
