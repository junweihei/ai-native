import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";

export function RouteErrorPage() {
  const error = useRouteError();
  const message =
    isRouteErrorResponse(error) && error.status === 404
      ? "没有找到这个页面。"
      : "页面加载失败。";

  return (
    <main className="fatal-error" role="alert">
      <h1>{message}</h1>
      <p>你可以安全返回今日入口。</p>
      <Link className="button-link" to="/today">
        返回今日
      </Link>
    </main>
  );
}
