import type { TodayWorkspaceSnapshot } from "../../shared/data-contract";

export function todayActionLabel(snapshot: TodayWorkspaceSnapshot): string {
  return snapshot.context?.task?.status === "not_started"
    ? "开始当前任务"
    : "继续当前任务";
}

export function todayActionEnabled(snapshot: TodayWorkspaceSnapshot): boolean {
  return Boolean(
    snapshot.context?.resolution === "resolved" &&
    snapshot.context.task?.executable &&
    snapshot.freshness.status !== "stale",
  );
}

export function resumeHref(snapshot: TodayWorkspaceSnapshot): string | null {
  const task = snapshot.context?.task;
  if (!task) return null;
  const query = new URLSearchParams();
  if (task.current_step) query.set("resume", task.current_step);
  if (task.next_action) query.set("next", task.next_action);
  const suffix = query.size ? `?${query.toString()}` : "";
  return `/tasks/${encodeURIComponent(task.id)}${suffix}`;
}
