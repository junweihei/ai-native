export const DATA_ACCESS_CONTRACT_VERSION = "1.0";

export type LearningIndexAvailability =
  | {
      availability: "ready";
      schemaVersion: string;
      generatedAt: string;
      sourceRevision: string;
    }
  | {
      availability: "unavailable";
      reason: "not-configured" | "not-generated" | "invalid" | "unreachable";
    };

export interface LearningIndexAdapter {
  describe(): Promise<LearningIndexAvailability>;
}
