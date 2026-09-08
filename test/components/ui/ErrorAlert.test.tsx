// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ErrorAlert } from "@/components/ui/ErrorAlert";

afterEach(() => {
  cleanup();
});

describe("ErrorAlert", () => {
  it("renders nothing when message is falsy", () => {
    const { container } = render(<ErrorAlert message={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders empty list as nothing", () => {
    const { container } = render(<ErrorAlert message={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a single message as text", () => {
    render(<ErrorAlert message="Gagal menyelesaikan penjemputan." />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Gagal menyelesaikan penjemputan.");
  });

  it("renders a list of messages", () => {
    render(
      <ErrorAlert message={["Data satu tidak tersedia", "Data dua tidak tersedia"]} />,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Data satu tidak tersedia");
    expect(alert).toHaveTextContent("Data dua tidak tersedia");
  });

  it("forwards id for aria-describedby association", () => {
    render(<ErrorAlert message="Email sudah terdaftar." id="login-error" />);
    expect(screen.getByRole("alert")).toHaveAttribute("id", "login-error");
  });

  it("merges className override", () => {
    render(<ErrorAlert message="Kesalahan." className="mt-6 text-xs" />);
    expect(screen.getByRole("alert")).toHaveClass("mt-6", "text-xs");
  });
});