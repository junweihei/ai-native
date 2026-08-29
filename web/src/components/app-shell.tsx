import { NavLink, Outlet } from "react-router-dom";
import { useDataSourceStatus } from "../data/data-source-context";

const navigation = [
  ["/today", "今日"],
  ["/roadmap", "路线图"],
  ["/knowledge", "知识地图"],
  ["/archive", "学习档案"],
  ["/review", "复盘"],
] as const;

export function AppShell() {
  const { status } = useDataSourceStatus();
  const sourceLabel =
    status === null
      ? "检查数据边界"
      : status.availability === "ready"
        ? "索引边界就绪"
        : "索引未连接";

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        跳到主要内容
      </a>
      <header className="topbar">
        <div>
          <p className="eyebrow">LOCAL · SINGLE USER</p>
          <span className="product-name">AI Native Learning OS</span>
        </div>
        <span className="source-status" aria-live="polite">
          {sourceLabel}
        </span>
      </header>
      <nav className="primary-nav" aria-label="一级导航">
        {navigation.map(([to, label]) => (
          <NavLink key={to} to={to}>
            {label}
          </NavLink>
        ))}
      </nav>
      <main id="main-content" className="workspace" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
