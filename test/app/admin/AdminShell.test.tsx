// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, fireEvent, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminShell } from "@/app/admin/_components/AdminShell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/dashboard",
}));

vi.mock("@/app/(auth)/login/actions", () => ({
  logout: vi.fn(),
}));

afterEach(cleanup);

describe("AdminShell Component", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })));

    // Default desktop width
    window.innerWidth = 1200;
  });

  it("renders with expanded sidebar and ml-72 on large screens", () => {
    render(
      <AdminShell isSuperAdmin={true}>
        <p>Main content area</p>
      </AdminShell>
    );

    const main = screen.getByText("Main content area").closest("main");
    expect(main).toHaveClass("ml-72");
    expect(screen.getByText("UanginKuy")).toBeInTheDocument();

    // Toggle collapse
    const collapseBtn = screen.getByRole("button", { name: /Perkecil Sidebar/i });
    act(() => {
      fireEvent.click(collapseBtn);
    });

    expect(main).toHaveClass("ml-16");
    expect(screen.queryByText("UanginKuy")).not.toBeInTheDocument();
  });

  it("auto-collapses sidebar when screen size is smaller (< 1024px)", () => {
    window.innerWidth = 900;
    render(
      <AdminShell isSuperAdmin={false}>
        <p>Tablet content area</p>
      </AdminShell>
    );

    const main = screen.getByText("Tablet content area").closest("main");
    expect(main).toHaveClass("ml-16");
    expect(screen.queryByText("UanginKuy")).not.toBeInTheDocument();

    // Can still manually expand on tablet if user wants
    const expandBtn = screen.getByRole("button", { name: /Perbesar Sidebar/i });
    act(() => {
      fireEvent.click(expandBtn);
    });

    expect(main).toHaveClass("ml-72");
    expect(screen.getByText("UanginKuy")).toBeInTheDocument();
  });
});
