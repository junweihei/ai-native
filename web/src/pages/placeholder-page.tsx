export interface PlaceholderPageProps {
  eyebrow: string;
  title: string;
  question: string;
  context?: string;
}

export function PlaceholderPage({
  eyebrow,
  title,
  question,
  context,
}: PlaceholderPageProps) {
  return (
    <article className="paper" aria-labelledby="page-title">
      <header className="page-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1 id="page-title">{title}</h1>
          <p className="page-question">{question}</p>
        </div>
        <button className="primary-action" type="button" disabled>
          页面功能待实现
        </button>
      </header>
      {context ? <p className="context-note">当前上下文：{context}</p> : null}
      <section className="placeholder" aria-label="页面占位">
        <h2>工程边界已就绪</h2>
        <p>
          本阶段仅提供路由、布局和状态容器；不加载学习内容，也不维护学习状态。
        </p>
      </section>
    </article>
  );
}
