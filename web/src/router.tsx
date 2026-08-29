import {
  Navigate,
  createBrowserRouter,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { AppShell } from "./components/app-shell";
import { PlaceholderPage } from "./pages/placeholder-page";
import { RouteErrorPage } from "./pages/route-error-page";
import { TodayPage } from "./pages/today-page";

const primaryPages = [
  {
    path: "roadmap",
    title: "路线图",
    question: "当前目标、里程碑与进度如何衔接？",
  },
  {
    path: "knowledge",
    title: "知识地图",
    question: "知识节点之间如何关联，我应从哪里继续？",
  },
  {
    path: "archive",
    title: "学习档案",
    question: "哪些成果和证据记录了能力变化？",
  },
  {
    path: "review",
    title: "复盘",
    question: "今天学到了什么，下一次从哪里续接？",
  },
];

function TaskWorkspacePlaceholder() {
  const { taskId } = useParams();
  const [search] = useSearchParams();
  const resume = search.get("resume");
  const next = search.get("next");
  const details = [
    taskId ? `任务引用 ${taskId}` : "未提供任务引用",
    resume ? `续接步骤 ${resume}` : null,
    next ? `下一动作 ${next}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <PlaceholderPage
      eyebrow="上下文页面"
      title="任务工作台"
      question="完成标准、过程和证据如何在同一上下文中推进？"
      context={details}
    />
  );
}

function KnowledgeNodePlaceholder() {
  const { nodeId } = useParams();
  return (
    <PlaceholderPage
      eyebrow="上下文页面"
      title="知识节点详情"
      question="这个知识节点是什么、为何相关、下一步如何使用？"
      context={nodeId ? `节点引用 ${nodeId}` : "未提供节点引用"}
    />
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <Navigate to="/today" replace /> },
      { path: "today", element: <TodayPage /> },
      ...primaryPages.map((page) => ({
        path: page.path,
        element: (
          <PlaceholderPage
            eyebrow="一级入口"
            title={page.title}
            question={page.question}
          />
        ),
      })),
      { path: "tasks/:taskId", element: <TaskWorkspacePlaceholder /> },
      { path: "knowledge/:nodeId", element: <KnowledgeNodePlaceholder /> },
      { path: "*", element: <RouteErrorPage /> },
    ],
  },
]);
