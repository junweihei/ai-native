export const DATA_ACCESS_CONTRACT_VERSION = "1.0";

export type LearningIndexAvailability =
  | {
      availability: "ready";
      schemaVersion: string;
      generatedAt: string;
      sourceRevision: string | null;
    }
  | {
      availability: "unavailable";
      reason: "not-configured" | "not-generated" | "invalid" | "unreachable";
    };

export interface TraceNode {
  id: string | null;
  title: string | null;
  status: string | null;
  acceptance_relation?: string | null;
}

export interface TodayIssue {
  code: string;
  message: string;
  impact: string;
}

export interface TodayCandidate {
  id: string;
  title: string | null;
  status: string | null;
}

export interface TodayTask {
  id: string;
  title: string | null;
  status: string | null;
  duration_text: string | null;
  objective: string | null;
  capability_targets: Array<{
    id: string;
    title: string | null;
    target_level: string | null;
  }>;
  primary_artifacts: string[];
  supporting_artifacts: string[];
  completion_rules: string[];
  evidence_requirements: string[];
  dependencies: Array<{ id: string; status: string | null }>;
  gate: { status: string; label: string; details: string[] };
  current_step: string | null;
  next_action: string | null;
  last_session: {
    id: string;
    updated: string | null;
    current_step: string | null;
    unresolved_issue: string | null;
  } | null;
  executable: boolean;
}

export interface TodayContext {
  resolution: "resolved" | "missing" | "ambiguous" | "partial";
  task_id?: string;
  candidates: TodayCandidate[];
  source_path: string | null;
  source_updated?: string | null;
  issues: TodayIssue[];
  trace?: {
    goal: TraceNode;
    month: TraceNode;
    week: TraceNode;
    day: Omit<TraceNode, "acceptance_relation">;
  };
  task?: TodayTask;
}

export interface TodayWorkspaceSnapshot {
  schemaVersion: string;
  generatedAt: string;
  source: {
    authority: "markdown";
    revision: string | null;
    indexPath: string;
  };
  freshness: {
    status: "fresh" | "stale" | "unknown";
    reason: string | null;
  };
  access: {
    mode: "read-only" | "read-write";
    reason: string | null;
    recovery: string | null;
  };
  context: TodayContext | null;
}

export interface LearningIndexAdapter {
  describe(): Promise<LearningIndexAvailability>;
  getToday(): Promise<TodayWorkspaceSnapshot>;
}
