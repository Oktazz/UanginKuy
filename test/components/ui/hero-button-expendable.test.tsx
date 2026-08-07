// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import Hero from "@/components/ui/hero-button-expendable";

afterEach(cleanup);

describe("Hero expandable button", () => {
  it("links new customers to registration with accessible default copy", () => {
    render(<Hero />);

    const link = screen.getByRole("link", { name: /Daftar Sekarang/i });
    expect(link).toHaveAttribute("href", "/register");
    expect(screen.getByText("Mulai dari rumah")).toBeInTheDocument();
  });

  it("supports custom copy and destination", () => {
    render(
      <Hero href="/demo" label="Lihat Demo" revealText="Tanpa komitmen" />,
    );

    expect(screen.getByRole("link", { name: /Lihat Demo/i })).toHaveAttribute(
      "href",
      "/demo",
    );
    expect(screen.getByText("Tanpa komitmen")).toBeInTheDocument();
  });
});
