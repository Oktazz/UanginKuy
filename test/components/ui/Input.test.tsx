// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Input } from "@/components/ui/Input";

afterEach(cleanup);

describe("Input component", () => {
  it("renders an input element with default modern styling matching admin pages", () => {
    render(<Input placeholder="Masukkan nama" />);

    const input = screen.getByPlaceholderText("Masukkan nama");
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass("rounded-xl");
    expect(input).toHaveClass("border-gray-200");
    expect(input).toHaveClass("bg-gray-50");
    expect(input).toHaveClass("h-12");
  });

  it("merges custom className when provided", () => {
    render(<Input placeholder="Custom" className="text-center custom-class" />);

    const input = screen.getByPlaceholderText("Custom");
    expect(input).toHaveClass("text-center");
    expect(input).toHaveClass("custom-class");
    expect(input).toHaveClass("rounded-xl");
  });
});
