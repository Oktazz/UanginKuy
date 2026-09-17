// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TicketsPage from "@/app/(nasabah)/tickets/page";

const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams("tab=history");

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => "/tickets",
}));

const mockTickets = [
  {
    id: "ticket-1",
    short_id: "TK-0001",
    status: "completed",
    service_type: "pickup",
    pickup_date: "2026-09-17",
    courier: { name: "Budi Santoso" },
    transaction_details: [
      {
        id: "td-1",
        weight: 5,
        price_applied: 4000,
        subtotal: 20000,
        waste_categories: { carbon_factor: 2.5 },
      },
    ],
  },
  {
    id: "ticket-2",
    short_id: "TK-0002",
    status: "completed",
    service_type: "drop_off",
    pickup_date: "2026-09-17",
    courier: null,
    transaction_details: [
      {
        id: "td-2",
        weight: 10,
        price_applied: 3000,
        subtotal: 30000,
        waste_categories: { carbon_factor: 2.5 },
      },
    ],
  },
];

describe("TicketsPage component", () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams("tab=history");
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: mockTickets }),
      })
    );
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders service type filter buttons and displays distinct badges for pickup and drop-off", async () => {
    render(<TicketsPage />);

    // Wait for tickets to load
    await waitFor(() => {
      expect(screen.getByText("Penjemputan Kurir Selesai")).toBeInTheDocument();
      expect(screen.getByText("Setor di Loket Selesai")).toBeInTheDocument();
    });

    // Check service type badges in the cards and filter buttons
    expect(screen.getAllByText("Jemput Kurir").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Setor di Loket").length).toBeGreaterThanOrEqual(2);

    // Check service filter controls
    const filterAllBtn = screen.getByRole("button", { name: /Semua/i });
    const filterPickupBtn = screen.getByRole("button", { name: /Jemput Kurir/i });
    const filterDropoffBtn = screen.getByRole("button", { name: /Setor di Loket/i });

    expect(filterAllBtn).toBeInTheDocument();
    expect(filterPickupBtn).toBeInTheDocument();
    expect(filterDropoffBtn).toBeInTheDocument();
  });

  it("filters tickets to only drop-off when Setor di Loket filter is selected", async () => {
    render(<TicketsPage />);

    await waitFor(() => {
      expect(screen.getByText("Penjemputan Kurir Selesai")).toBeInTheDocument();
    });

    const filterDropoffBtn = screen.getByRole("button", { name: /Setor di Loket/i });
    fireEvent.click(filterDropoffBtn);

    expect(mockReplace).toHaveBeenCalledWith("/tickets?tab=history&type=drop_off", {
      scroll: false,
    });

    // Pickup should no longer be visible
    expect(screen.queryByText("Penjemputan Kurir Selesai")).not.toBeInTheDocument();
    // Drop-off should remain visible
    expect(screen.getByText("Setor di Loket Selesai")).toBeInTheDocument();
  });

  it("filters tickets to only pickup when Jemput Kurir filter is selected", async () => {
    render(<TicketsPage />);

    await waitFor(() => {
      expect(screen.getByText("Setor di Loket Selesai")).toBeInTheDocument();
    });

    const filterPickupBtn = screen.getByRole("button", { name: /Jemput Kurir/i });
    fireEvent.click(filterPickupBtn);

    expect(mockReplace).toHaveBeenCalledWith("/tickets?tab=history&type=pickup", {
      scroll: false,
    });

    // Drop-off should no longer be visible
    expect(screen.queryByText("Setor di Loket Selesai")).not.toBeInTheDocument();
    // Pickup should remain visible
    expect(screen.getByText("Penjemputan Kurir Selesai")).toBeInTheDocument();
  });

  it("does not render service type filter buttons on active tab", async () => {
    mockSearchParams = new URLSearchParams("tab=active");
    render(<TicketsPage />);

    await waitFor(() => {
      expect(screen.getByText("Penjemputan Kurir Selesai")).toBeInTheDocument();
    });

    // Filter controls should not be rendered on active tab
    expect(screen.queryByLabelText("Filter kalender bulan")).not.toBeInTheDocument();
    expect(screen.queryByText("Jenis Layanan:")).not.toBeInTheDocument();
  });

  it("renders monthly filter and displays monthly summary stats for the current month", async () => {
    mockSearchParams = new URLSearchParams("tab=history");
    render(<TicketsPage />);

    await waitFor(() => {
      expect(screen.getByText("Penjemputan Kurir Selesai")).toBeInTheDocument();
    });

    // Month filter should be visible with current month
    expect(screen.getByLabelText("Filter kalender bulan")).toBeInTheDocument();
    expect(screen.getByText("September 2026")).toBeInTheDocument();

    // Summary stats for current month (2 tickets, 15 kg, Rp 50.000)
    expect(screen.getByText("Total Setoran")).toBeInTheDocument();
    expect(screen.getByText("2 transaksi")).toBeInTheDocument();
    expect(screen.getByText("15.0 kg")).toBeInTheDocument();
  });

  it("filters tickets when a different month is requested in searchParams", async () => {
    // Specify a past month with no tickets in mockTickets
    mockSearchParams = new URLSearchParams("tab=history&month=2026-08");
    render(<TicketsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Tidak Ada Riwayat pada/i)).toBeInTheDocument();
    });

    // Action button to show all months
    const showAllBtn = screen.getByRole("button", { name: /Tampilkan Semua Bulan/i });
    expect(showAllBtn).toBeInTheDocument();
    fireEvent.click(showAllBtn);

    expect(mockReplace).toHaveBeenCalledWith("/tickets?tab=history&month=all", {
      scroll: false,
    });
  });

  it("navigates months using calendar picker arrows", async () => {
    mockSearchParams = new URLSearchParams("tab=history");
    render(<TicketsPage />);

    await waitFor(() => {
      expect(screen.getByText("Penjemputan Kurir Selesai")).toBeInTheDocument();
    });

    const prevMonthBtn = screen.getByRole("button", { name: "Bulan sebelumnya" });
    fireEvent.click(prevMonthBtn);

    expect(mockReplace).toHaveBeenCalledWith("/tickets?tab=history&month=2026-08", {
      scroll: false,
    });
  });
});
