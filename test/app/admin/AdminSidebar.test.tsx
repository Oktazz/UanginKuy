// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/dashboard",
}));

vi.mock("@/app/(auth)/login/actions", () => ({
  logout: vi.fn(),
}));

afterEach(cleanup);

describe("AdminSidebar Component", () => {
  it("renders in expanded mode with labels and logo text", () => {
    const onToggle = vi.fn();
    render(<AdminSidebar isSuperAdmin={true} isCollapsed={false} onToggle={onToggle} />);

    expect(screen.getByText("UanginKuy")).toBeInTheDocument();
    expect(screen.getByText("Super Admin")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Loket")).toBeInTheDocument();
    expect(screen.getByText("Pengetahuan AI")).toBeInTheDocument();
    expect(screen.getByText("Keluar Sistem")).toBeInTheDocument();

    const collapseBtn = screen.getByRole("button", { name: /Perkecil Sidebar/i });
    expect(collapseBtn).toBeInTheDocument();
    fireEvent.click(collapseBtn);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("renders in collapsed mode without text labels and shows expand button", () => {
    const onToggle = vi.fn();
    render(<AdminSidebar isSuperAdmin={false} isCollapsed={true} onToggle={onToggle} />);

    // Text labels should be hidden
    expect(screen.queryByText("UanginKuy")).not.toBeInTheDocument();
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();

    const expandBtn = screen.getByRole("button", { name: /Perbesar Sidebar/i });
    expect(expandBtn).toBeInTheDocument();
    fireEvent.click(expandBtn);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
