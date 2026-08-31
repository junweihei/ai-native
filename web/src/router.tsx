import {
  Navigate,
  createBrowserRouter,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { ArchivePage, ArchiveRecordPage } from "./pages/archive-page";
import { AppShell } from "./components/app-shell";
import { KnowledgePage } from "./pages/knowledge-page";
import { ReviewPage } from "./pages/review-page";
import { RoadmapPage } from "./pages/roadmap-page";
import { RouteErrorPage } from "./pages/route-error-page";
import { TaskWorkspacePage } from "./pages/task-workspace-page";
import { TodayPage } from "./pages/today-page";

function TaskWorkspaceRoute() {
  const { taskId } = useParams();
  const [search] = useSearchParams();
  return (
    <TaskWorkspacePage
      taskId={taskId}
      resume={search.get("resume")}
      next={search.get("next")}
    />
  );
}
function KnowledgeNodeRoute() {
  const { nodeId } = useParams();
  return <KnowledgePage nodeId={nodeId} />;
}
function ArchiveRecordRoute() {
  const { recordId } = useParams();
  return <ArchiveRecordPage recordId={recordId} />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <Navigate to="/today" replace /> },
      { path: "today", element: <TodayPage /> },
      { path: "roadmap", element: <RoadmapPage /> },
      { path: "knowledge", element: <KnowledgePage /> },
      { path: "review", element: <ReviewPage /> },
      { path: "archive", element: <ArchivePage /> },
      { path: "archive/:recordId", element: <ArchiveRecordRoute /> },

      { path: "tasks/:taskId", element: <TaskWorkspaceRoute /> },
      { path: "knowledge/:nodeId", element: <KnowledgeNodeRoute /> },
      { path: "*", element: <RouteErrorPage /> },
    ],
  },
]);
