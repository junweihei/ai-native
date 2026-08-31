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
  getRoadmap?(): Promise<RoadmapSnapshot>;
  getKnowledge?(): Promise<unknown>;
  getArchive?(): Promise<unknown>;
}
export type WriteResultCode =
  | "preview_ready"
  | "confirmation_expired"
  | "validation_failed"
  | "conflict"
  | "path_forbidden"
  | "permission_denied"
  | "write_failed"
  | "committed"
  | "committed_index_stale"
  | "no_changes"
  | "temporarily_unavailable";

export interface WriteTargetInput {
  objectType: "artifact" | "evidence" | "session" | "review";
  path: string;
  content: string;
  baseRevision: string | null;
}

export interface WritePreviewRequest {
  taskId: string;
  sourceRevision: string;
  targets: WriteTargetInput[];
  completionChecks: string[];
  requestedTaskStatus?: "learning" | "blocked" | "completed" | "verified";
}

export interface WriteTargetPreview {
  objectType: "artifact" | "evidence" | "session" | "review" | "task";
  path: string;
  baseRevision: string | null;
  currentRevision: string | null;
  addedLines: number;
  removedLines: number;
  templateRequirement: string;
}

export interface WriteResult {
  code: WriteResultCode;
  message: string;
  intentId: string | null;
  authoritativeChanged: boolean;
  taskStatusChanged: boolean;
  capabilityChanged: false;
  draftPreserved: boolean;
  recovery: Array<"copy" | "retry" | "reload" | "repreview">;
  targets: WriteTargetPreview[];
  sourceRevision: string | null;
}

export type TaskProtocolStep =
  | "locate"
  | "closed_book_first_pass"
  | "specified_input"
  | "active_processing"
  | "artifact"
  | "self_check"
  | "single_issue_revision"
  | "close";

export interface ControlledPlaceholder {
  control_id: string;
  safe_category: string;
  condition: string;
  access_state: "locked" | "available" | "unknown";
}

export interface FirstVersionReceipt {
  versionId: string;
  recordedAt: string;
  contentHash: string;
}

export interface ControlledOpenResult {
  decision: "available" | "locked";
  reason: string;
  decidedAt: string;
  items: Array<{ label: string; content: string }>;
}

export interface TodayTask {
  template?: { template_id: string | null; label: string | null };
  step_protocol?: TaskProtocolStep[];
  not_applicable_steps?: TaskProtocolStep[];
  resources?: Array<{ id: string; allowed_scope: string | null }>;
  knowledge_nodes?: Array<{ id: string; role: string | null }>;
  self_check?: string[];
  controlled_materials?: ControlledPlaceholder[];
}
export interface RoadmapTask {
  id: string;
  title: string;
  timeRange: string | null;
  status: string | null;
  dependencies: string[];
  gate: string | null;
  acceptance: string | null;
  blockedReason: string | null;
  unlockCondition: string | null;
  current: boolean;
  relationIssues: string[];
}

export interface RoadmapWeek {
  id: string;
  title: string;
  gate: string | null;
  tasks: RoadmapTask[];
}

export interface RoadmapMonth {
  id: string;
  title: string;
  capabilityRange: string | null;
  projectIncrement: string | null;
  acceptance: string | null;
  status: string | null;
  partial: boolean;
  weeks: RoadmapWeek[];
}

export interface RoadmapSnapshot {
  sourceRevision: string | null;
  freshness: TodayWorkspaceSnapshot["freshness"];
  currentTaskId: string | null;
  relationIssues: Array<{ code: string; message: string }>;
  months: RoadmapMonth[];
}
