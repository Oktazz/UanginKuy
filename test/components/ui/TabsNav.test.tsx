// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TabsNav } from "@/components/ui/TabsNav";

afterEach(cleanup);

describe("TabsNav component", () => {
  const sampleTabs = [
    { value: "active", label: "Tiket Aktif" },
    { value: "history", label: "Riwayat Selesai" },
  ];

  it("renders all tabs correctly with accessible navigation label", () => {
    render(
      <TabsNav
        ariaLabel="Kategori tiket"
        tabs={sampleTabs}
        activeTab="active"
        onChange={vi.fn()}
      />
    );

    const nav = screen.getByRole("navigation", { name: "Kategori tiket" });
    expect(nav).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Tiket Aktif" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Riwayat Selesai" })).toBeInTheDocument();
  });

  it("sets aria-current='page' on active tab and fires onChange when clicked", () => {
    const handleChange = vi.fn();
    render(
      <TabsNav
        tabs={sampleTabs}
        activeTab="active"
        onChange={handleChange}
      />
    );

    const activeBtn = screen.getByRole("button", { name: "Tiket Aktif" });
    const historyBtn = screen.getByRole("button", { name: "Riwayat Selesai" });

    expect(activeBtn).toHaveAttribute("aria-current", "page");
    expect(historyBtn).not.toHaveAttribute("aria-current");

    fireEvent.click(historyBtn);
    expect(handleChange).toHaveBeenCalledWith("history");
  });

  it("renders icons and badges when provided", () => {
    render(
      <TabsNav
        tabs={[
          {
            value: "tab1",
            label: "Tab Satu",
            icon: <span data-testid="icon-1">Icon</span>,
            badge: <span data-testid="badge-1">5</span>,
          },
        ]}
        activeTab="tab1"
        onChange={vi.fn()}
      />
    );

    expect(screen.getByTestId("icon-1")).toBeInTheDocument();
    expect(screen.getByTestId("badge-1")).toBeInTheDocument();
  });

  it("does not fire onChange when a disabled tab is clicked", () => {
    const handleChange = vi.fn();
    render(
      <TabsNav
        tabs={[
          { value: "active", label: "Aktif" },
          { value: "disabled", label: "Dinonaktifkan", disabled: true },
        ]}
        activeTab="active"
        onChange={handleChange}
      />
    );

    const disabledBtn = screen.getByRole("button", { name: "Dinonaktifkan" });
    expect(disabledBtn).toBeDisabled();

    fireEvent.click(disabledBtn);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("applies custom size and custom styling classes", () => {
    render(
      <TabsNav
        tabs={sampleTabs}
        activeTab="active"
        onChange={vi.fn()}
        size="lg"
        className="custom-nav"
        activeClassName="custom-active"
        inactiveClassName="custom-inactive"
      />
    );

    const nav = screen.getByRole("navigation");
    expect(nav).toHaveClass("custom-nav");

    const activeBtn = screen.getByRole("button", { name: "Tiket Aktif" });
    expect(activeBtn).toHaveClass("custom-active");
    expect(activeBtn).toHaveClass("py-3");

    const inactiveBtn = screen.getByRole("button", { name: "Riwayat Selesai" });
    expect(inactiveBtn).toHaveClass("custom-inactive");
  });
});
