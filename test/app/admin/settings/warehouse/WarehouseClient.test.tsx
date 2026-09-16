// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { saveWarehouseLocationMock } = vi.hoisted(() => ({
  saveWarehouseLocationMock: vi.fn(),
}));

vi.mock("@/app/admin/settings/warehouse/actions", () => ({
  saveWarehouseLocation: saveWarehouseLocationMock,
}));

vi.mock("react-map-gl/maplibre", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-map">{children}</div>
  ),
  Marker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-marker">{children}</div>
  ),
  NavigationControl: () => <div data-testid="mock-nav-control" />,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

import WarehouseClient from "@/app/admin/settings/warehouse/_components/WarehouseClient";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("WarehouseClient", () => {
  it("renders with initial warehouse data and allows updating", async () => {
    saveWarehouseLocationMock.mockResolvedValue({ success: true });

    const initialData = {
      latitude: -6.2088,
      longitude: 106.8456,
      name: "Depo Pusat Merdeka",
      address: "Jl. Merdeka No. 45, Jakarta",
      phone: "0812999888",
    };

    render(<WarehouseClient initialData={initialData} />);

    expect(screen.getByText("Pengaturan Gudang & Depo")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Depo Pusat Merdeka")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Jl. Merdeka No. 45, Jakarta")).toBeInTheDocument();
    expect(screen.getByDisplayValue("0812999888")).toBeInTheDocument();

    // Change warehouse name
    const nameInput = screen.getByDisplayValue("Depo Pusat Merdeka");
    fireEvent.change(nameInput, { target: { value: "Depo Utama UanginKuy Baru" } });

    // Submit
    const submitBtn = screen.getByRole("button", { name: /simpan perubahan/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(saveWarehouseLocationMock).toHaveBeenCalledWith({
        latitude: -6.2088,
        longitude: 106.8456,
        name: "Depo Utama UanginKuy Baru",
        address: "Jl. Merdeka No. 45, Jakarta",
        phone: "0812999888",
      });
      expect(
        screen.getByText("Profil dan titik lokasi gudang berhasil disimpan!")
      ).toBeInTheDocument();
    });
  });
});
