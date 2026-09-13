// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChatbotIcon } from "@/components/ai-chat/ChatbotIcon";

describe("ChatbotIcon Component", () => {
  it("renders with default props (size=24, fill=#ffffff)", () => {
    const { container } = render(<ChatbotIcon />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("width", "24");
    expect(svg).toHaveAttribute("height", "24");
    expect(svg).toHaveAttribute("viewBox", "0 0 240 240");
    expect(svg).toHaveAttribute("aria-hidden", "true");

    const g = svg?.querySelector("g");
    expect(g).toHaveAttribute("fill", "#ffffff");
  });

  it("supports custom size and fill", () => {
    const { container } = render(<ChatbotIcon size={38} fill="#1a4c34" className="custom-icon" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "38");
    expect(svg).toHaveAttribute("height", "38");
    expect(svg).toHaveClass("custom-icon");

    const g = svg?.querySelector("g");
    expect(g).toHaveAttribute("fill", "#1a4c34");
  });

  it("falls back to color prop or currentColor if fill is not passed or empty", () => {
    const { container: container1 } = render(<ChatbotIcon fill="" color="#2E7D32" />);
    const g1 = container1.querySelector("g");
    expect(g1).toHaveAttribute("fill", "#2E7D32");

    const { container: container2 } = render(<ChatbotIcon fill="" />);
    const g2 = container2.querySelector("g");
    expect(g2).toHaveAttribute("fill", "currentColor");
  });

  it("contains robot mascot elements (head frame, ears, eyes, mouth)", () => {
    const { container } = render(<ChatbotIcon />);
    const paths = container.querySelectorAll("path");
    const circles = container.querySelectorAll("circle");

    // Head frame with sprout + 2 ears + 1 mouth = 4 paths
    expect(paths.length).toBe(4);
    // 2 eyes = 2 circles
    expect(circles.length).toBe(2);
  });
});
