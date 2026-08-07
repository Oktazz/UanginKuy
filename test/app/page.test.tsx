// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll: vi.fn(), set: vi.fn() })),
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mocks.getUser },
  })),
}));

import Page from "@/app/page";

afterEach(cleanup);

describe("UanginKuy landing page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: null } });
  });

  it("communicates the core value and primary customer journey", async () => {
    render(await Page());

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Sampah rumahmu dijemput\. Nilainya masuk saldo\./i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Dari rumah ke saldo/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Semua yang kamu butuhkan/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Pertanyaan yang sering ditanyakan/i })).toBeInTheDocument();
  });

  it("offers registration and login without fabricated social proof", async () => {
    render(await Page());

    expect(screen.getAllByRole("link", { name: /Daftar Sekarang/i })[0]).toHaveAttribute(
      "href",
      "/register",
    );
    expect(screen.getAllByRole("link", { name: /Masuk/i })[0]).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.queryByText(/dipercaya oleh \d+/i)).not.toBeInTheDocument();
  });

  it("keeps the primary registration action available in the compact header", async () => {
    render(await Page());

    const header = screen.getByRole("banner");
    expect(header).toHaveTextContent("Daftar");
    const registerLink = header.querySelector('a[href="/register"]');
    expect(registerLink).not.toBeNull();
    expect(registerLink).toHaveAttribute("href", "/register");
  });

  it("constrains the dashboard preview for narrow viewports", async () => {
    render(await Page());

    expect(screen.getByLabelText("Contoh tampilan dashboard UanginKuy")).toHaveClass("min-w-0");
  });

  it("provides in-page navigation and a skip link", async () => {
    render(await Page());

    expect(screen.getByRole("link", { name: /Lewati ke konten/i })).toHaveAttribute(
      "href",
      "#konten-utama",
    );
    expect(screen.getByRole("link", { name: "Fitur" })).toHaveAttribute("href", "#fitur");
    expect(screen.getByRole("link", { name: "Cara Kerja" })).toHaveAttribute(
      "href",
      "#cara-kerja",
    );
    expect(screen.getByRole("link", { name: "FAQ" })).toHaveAttribute("href", "#faq");
  });
});
