// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BotBubble } from "@/components/ai-chat/ChatBubble";

describe("BotBubble Component", () => {
  it("renders with animate-stream-word classes on words when isStreaming is true", () => {
    const { container } = render(
      <BotBubble content="Halo Nasabah UanginKuy!" isStreaming={true} />
    );

    const animatedWords = container.querySelectorAll(".animate-stream-word");
    expect(animatedWords.length).toBeGreaterThan(0);
    // Words like "Halo", "Nasabah", "UanginKuy!" should each be wrapped in animated spans
    expect(screen.getByText("Halo")).toHaveClass("animate-stream-word");
    expect(screen.getByText("Nasabah")).toHaveClass("animate-stream-word");
    expect(screen.getByText("UanginKuy!")).toHaveClass("animate-stream-word");
  });

  it("does not render animate-stream-word classes when isStreaming is false", () => {
    const { container } = render(
      <BotBubble content="Halo Nasabah UanginKuy!" isStreaming={false} />
    );

    const animatedWords = container.querySelectorAll(".animate-stream-word");
    expect(animatedWords.length).toBe(0);
    expect(container).toHaveTextContent("Halo Nasabah UanginKuy!");
  });

  it("supports markdown bold and italic with streaming fade-in tokens", () => {
    const { container } = render(
      <BotBubble content="Total: **Rp 50.000** *sukses*" isStreaming={true} />
    );

    const strong = container.querySelector("strong");
    expect(strong).toBeInTheDocument();
    expect(strong).toHaveTextContent("Rp 50.000");
    expect(strong?.querySelector(".animate-stream-word")).toBeInTheDocument();

    const em = container.querySelector("em");
    expect(em).toBeInTheDocument();
    expect(em).toHaveTextContent("sukses");
    expect(em?.querySelector(".animate-stream-word")).toBeInTheDocument();
  });
});
