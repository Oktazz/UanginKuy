// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MonthCalendarPicker } from "@/components/ui/MonthCalendarPicker";

afterEach(cleanup);

describe("MonthCalendarPicker component", () => {
  it("renders with display label and handles stepper navigation", () => {
    const handleChange = vi.fn();
    render(
      <MonthCalendarPicker
        value="2026-09"
        onChange={handleChange}
      />
    );

    expect(screen.getByText(/September 2026/i)).toBeInTheDocument();

    const prevBtn = screen.getByRole("button", { name: "Bulan sebelumnya" });
    fireEvent.click(prevBtn);
    expect(handleChange).toHaveBeenCalledWith("2026-08");

    const nextBtn = screen.getByRole("button", { name: "Bulan berikutnya" });
    fireEvent.click(nextBtn);
    expect(handleChange).toHaveBeenCalledWith("2026-10");
  });

  it("opens popover calendar and selects a month from the grid", () => {
    const handleChange = vi.fn();
    render(
      <MonthCalendarPicker
        value="2026-09"
        onChange={handleChange}
        ticketMonths={["2026-09", "2026-08"]}
      />
    );

    const triggerBtn = screen.getByRole("button", { name: /September 2026/i });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Open calendar popover
    fireEvent.click(triggerBtn);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("2026")).toBeInTheDocument();

    // Click on Maret (Mar)
    const marBtn = screen.getByRole("button", { name: /Mar/i });
    fireEvent.click(marBtn);

    expect(handleChange).toHaveBeenCalledWith("2026-03");
    // Popover closes after selection
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("supports year navigation and quick actions in the popover", () => {
    const handleChange = vi.fn();
    render(
      <MonthCalendarPicker
        value="2026-09"
        onChange={handleChange}
      />
    );

    const triggerBtn = screen.getByRole("button", { name: /September 2026/i });
    fireEvent.click(triggerBtn);

    // Navigate to previous year
    const prevYearBtn = screen.getByRole("button", { name: "Tahun sebelumnya" });
    fireEvent.click(prevYearBtn);
    expect(screen.getByText("2025")).toBeInTheDocument();

    // Select Jan 2025
    const janBtn = screen.getByRole("button", { name: /Jan/i });
    fireEvent.click(janBtn);
    expect(handleChange).toHaveBeenCalledWith("2025-01");

    // Open again and click "Semua Bulan"
    fireEvent.click(triggerBtn);
    const allMonthsBtn = screen.getByRole("button", { name: /Semua Bulan/i });
    fireEvent.click(allMonthsBtn);
    expect(handleChange).toHaveBeenCalledWith("all");
  });

  it("closes popover when pressing Escape", () => {
    render(
      <MonthCalendarPicker
        value="2026-09"
        onChange={vi.fn()}
      />
    );

    const triggerBtn = screen.getByRole("button", { name: /September 2026/i });
    fireEvent.click(triggerBtn);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
