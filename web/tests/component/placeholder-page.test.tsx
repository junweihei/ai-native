import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlaceholderPage } from "../../src/pages/placeholder-page";

describe("PlaceholderPage", () => {
  it("exposes one disabled primary action and the page purpose", () => {
    render(
      <PlaceholderPage
        eyebrow="一级入口"
        title="今日"
        question="今天最值得推进的学习任务是什么？"
      />,
    );

    expect(screen.getByRole("heading", { name: "今日" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "页面功能待实现" }),
    ).toBeDisabled();
  });
});
