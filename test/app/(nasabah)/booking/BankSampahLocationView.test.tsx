// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("react-map-gl/maplibre", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-map">{children}</div>
  ),
  Marker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-marker">{children}</div>
  ),
  NavigationControl: () => <div data-testid="mock-nav-control" />,
}));

import { BankSampahLocationView } from "@/app/(nasabah)/booking/_components/BankSampahLocationView";

afterEach(() => {
  cleanup();
});

describe("BankSampahLocationView", () => {
  it("renders warehouse info and google maps navigation link", () => {
    const mockLocation = {
      latitude: -6.2000,
      longitude: 106.8166,
      address: "Jl. Sudirman Kav. 1, Jakarta Pusat",
      name: "Bank Sampah Sudirman",
      operatingHours: "08.00 - 16.00 WIB",
    };

    render(<BankSampahLocationView location={mockLocation} />);

    // Depo details
    expect(screen.getAllByText("Bank Sampah Sudirman")[0]).toBeInTheDocument();
    expect(screen.getByText("Jl. Sudirman Kav. 1, Jakarta Pusat")).toBeInTheDocument();
    expect(screen.getByText("08.00 - 16.00 WIB")).toBeInTheDocument();

    // Google Maps link with correct coordinates
    const navButton = screen.getByRole("link", { name: /buka navigasi google maps/i });
    expect(navButton).toBeInTheDocument();
    expect(navButton).toHaveAttribute(
      "href",
      "https://www.google.com/maps/dir/?api=1&destination=-6.2,106.8166"
    );
    expect(navButton).toHaveAttribute("target", "_blank");

    // Walk-in Guide sections
    expect(screen.getByText("Pilah Sampah")).toBeInTheDocument();
    expect(screen.getByText("Datang ke Depo")).toBeInTheDocument();
    expect(screen.getByText("Timbang & Cairkan")).toBeInTheDocument();
  });

  it("uses default fallback when location is null", () => {
    render(<BankSampahLocationView location={null} />);

    expect(screen.getAllByText("Gudang & Depo Utama UanginKuy")[0]).toBeInTheDocument();
    const navButton = screen.getByRole("link", { name: /buka navigasi google maps/i });
    expect(navButton).toHaveAttribute(
      "href",
      "https://www.google.com/maps/dir/?api=1&destination=-6.2088,106.8456"
    );
  });

  it("renders map container, center button, and coordinates badge", () => {
    const mockLocation = {
      latitude: -7.25000,
      longitude: 112.75000,
      address: "Jl. Pemuda No. 10, Surabaya",
      name: "Bank Sampah Surabaya",
      operatingHours: "08.30 - 15.30 WIB",
      phone: "08123456789",
    };

    render(<BankSampahLocationView location={mockLocation} />);

    // Map container and elements
    expect(screen.getByTestId("mock-map")).toBeInTheDocument();
    expect(screen.getByText("Peta Lokasi Bank Sampah")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pusatkan peta/i })).toBeInTheDocument();
    expect(screen.getByText("-7.25000, 112.75000")).toBeInTheDocument();
    expect(screen.getByText("Kontak Depo: 08123456789")).toBeInTheDocument();
  });
});
