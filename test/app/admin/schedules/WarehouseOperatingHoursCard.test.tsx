// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { saveWarehouseOperatingHoursMock } = vi.hoisted(() => ({
  saveWarehouseOperatingHoursMock: vi.fn(),
}));

vi.mock("@/app/admin/schedules/actions", () => ({
  saveWarehouseOperatingHours: saveWarehouseOperatingHoursMock,
}));

import { WarehouseOperatingHoursCard } from "@/app/admin/schedules/_components/WarehouseOperatingHoursCard";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("WarehouseOperatingHoursCard", () => {
  it("renders with default values when initialData is null", () => {
    render(<WarehouseOperatingHoursCard initialData={null} />);

    expect(screen.getByText("Pengaturan Jam Buka Bank Sampah")).toBeInTheDocument();
    expect(screen.getByDisplayValue("08:00")).toBeInTheDocument();
    expect(screen.getByDisplayValue("16:00")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Senin - Sabtu")).toBeInTheDocument();

    // Live preview
    expect(screen.getByText("08.00 - 16.00 WIB")).toBeInTheDocument();
  });

  it("updates live preview when changing inputs and presets", () => {
    render(<WarehouseOperatingHoursCard initialData={null} />);

    // Click preset button "Senin - Jumat"
    const presetBtn = screen.getByRole("button", { name: "Senin - Jumat" });
    fireEvent.click(presetBtn);

    expect(screen.getByDisplayValue("Senin - Jumat")).toBeInTheDocument();
    expect(screen.getByText(/Jam Operasional \(Senin - Jumat\)/i)).toBeInTheDocument();

    // Change open time
    const openTimeInput = screen.getByDisplayValue("08:00");
    fireEvent.change(openTimeInput, { target: { value: "09:00" } });

    expect(screen.getByText("09.00 - 16.00 WIB")).toBeInTheDocument();
  });

  it("calls saveWarehouseOperatingHours on form submission", async () => {
    saveWarehouseOperatingHoursMock.mockResolvedValue({ success: true });

    render(
      <WarehouseOperatingHoursCard
        initialData={{
          openTime: "08:00",
          closeTime: "16:00",
          daysLabel: "Senin - Sabtu",
          notes: "Istirahat 12-13",
          isActive: true,
        }}
      />
    );

    const submitBtn = screen.getByRole("button", { name: /simpan pengaturan jam buka/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(saveWarehouseOperatingHoursMock).toHaveBeenCalledWith({
        openTime: "08:00",
        closeTime: "16:00",
        daysLabel: "Senin - Sabtu",
        notes: "Istirahat 12-13",
        isActive: true,
      });
      expect(
        screen.getByText("Jadwal operasional bank sampah berhasil disimpan!")
      ).toBeInTheDocument();
    });
  });
});
