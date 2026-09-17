// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import CounterClient from "@/app/admin/counter/_components/CounterClient";
import * as thermalPrintModule from "@/utils/thermal-print";

afterEach(cleanup);

const mockCategories = [
  {
    id: 1,
    name: "Kardus Bekas",
    material_group: "Kertas",
    price_per_kg: 2500,
    carbon_factor: 2.5,
  },
  {
    id: 2,
    name: "Botol PET",
    material_group: "Plastik",
    price_per_kg: 4000,
    carbon_factor: 3.0,
  },
];

describe("CounterClient Regular UI Modal & Thermal Printing", () => {
  it("renders regular UI modal on dropoff completion and prints thermal receipt on action", async () => {
    const printSpy = vi
      .spyOn(thermalPrintModule, "printThermalElement")
      .mockReturnValue(true);

    // Mock search-nasabah API response
    global.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes("/api/counter/search-nasabah")) {
        return Promise.resolve({
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                id: "client-123",
                name: "Budi Santoso",
                account_number: "UKN-9988",
                balance: 50000,
              },
            }),
        });
      }
      if (url.includes("/api/counter/drop-off") && init?.method === "POST") {
        return Promise.resolve({
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                ticketId: "ticket-abc-123",
                ticketShortId: "TK-12345",
                clientId: "client-123",
                clientName: "Budi Santoso",
                clientAccountNumber: "UKN-9988",
                paymentMethod: "cash",
                totalWeight: 3.5,
                totalAmount: 8750,
                carbonSaved: 8.75,
                completedAt: new Date().toISOString(),
                items: [
                  {
                    categoryName: "Kardus Bekas",
                    weight: 3.5,
                    priceApplied: 2500,
                    subtotal: 8750,
                  },
                ],
              },
            }),
        });
      }
      return Promise.resolve({
        json: () => Promise.resolve({ success: true, data: [] }),
      });
    }) as unknown as typeof fetch;

    render(<CounterClient categories={mockCategories} />);

    // Search client
    const searchInput = screen.getByPlaceholderText(/Member ID Nasabah/i);
    fireEvent.change(searchInput, { target: { value: "UKN-9988" } });

    // Submit search
    const cariBtn = screen.getByRole("button", { name: /Cari ID/i });
    fireEvent.click(cariBtn);

    // Wait for client to be selected
    await waitFor(() => {
      expect(screen.getByText("Budi Santoso")).toBeDefined();
    });

    // Add weight
    const weightInput = screen.getByPlaceholderText(/Contoh: 2\.5/i);
    fireEvent.change(weightInput, { target: { value: "3.5" } });

    const tambahBtn = screen.getByRole("button", { name: /Tambah Item/i });
    fireEvent.click(tambahBtn);

    // Submit drop-off
    const submitDropoffBtn = screen.getByRole("button", {
      name: /Selesaikan Transaksi/i,
    });
    fireEvent.click(submitDropoffBtn);

    // Verify Regular UI Modal appears
    await waitFor(() => {
      expect(screen.getByText("Drop-off Selesai!")).toBeDefined();
    });

    // Regular UI details check
    expect(screen.getByText("#TK-12345")).toBeDefined();
    expect(screen.getAllByText(/3\.50/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Tunai \/ Cash Langsung/i)).toBeDefined();

    // Click "Cetak Struk"
    const printBtn = screen.getByRole("button", { name: /Cetak Struk/i });
    fireEvent.click(printBtn);

    expect(printSpy).toHaveBeenCalled();
    const calledElement = printSpy.mock.calls[0][0];
    expect(calledElement.id).toBe("dropoff-thermal-receipt");

    printSpy.mockRestore();
  });

  it("renders regular UI modal on cashout execution and prints thermal receipt on action", async () => {
    const printSpy = vi
      .spyOn(thermalPrintModule, "printThermalElement")
      .mockReturnValue(true);

    global.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes("/api/counter/cash-out?token=819201")) {
        return Promise.resolve({
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                withdrawalId: "with-12345678",
                tokenCode: "819201",
                amount: 50000,
                client: {
                  id: "client-1",
                  name: "Siti Aminah",
                  account_number: "UKN-7788",
                  balance: 120000,
                  avatar_url: null,
                },
                expiresAt: "2026-09-17T15:00:00.000Z",
                isExpired: false,
              },
            }),
        });
      }
      if (url.includes("/api/counter/cash-out") && init?.method === "POST") {
        return Promise.resolve({
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                withdrawalId: "with-12345678",
                tokenCode: "819201",
                amount: 50000,
                client: {
                  id: "client-1",
                  name: "Siti Aminah",
                  account_number: "UKN-7788",
                  balance: 120000,
                  avatar_url: null,
                },
                expiresAt: "2026-09-17T15:00:00.000Z",
                isExpired: false,
              },
            }),
        });
      }
      return Promise.resolve({
        json: () => Promise.resolve({ success: true, data: [] }),
      });
    }) as unknown as typeof fetch;

    render(<CounterClient categories={mockCategories} />);

    // Switch to Tab 2: Kasir Tarik Tunai
    const cashoutTab = screen.getByRole("button", { name: /Kasir Tarik Tunai/i });
    fireEvent.click(cashoutTab);

    // Enter token
    const tokenInput = screen.getByPlaceholderText(/Contoh: 482910/i);
    fireEvent.change(tokenInput, { target: { value: "819201" } });

    // Verify token
    const verifyBtn = screen.getByRole("button", { name: /^Verifikasi$/i });
    fireEvent.click(verifyBtn);

    // Wait for verified info card
    await waitFor(() => {
      expect(screen.getByText("Siti Aminah")).toBeDefined();
    });

    // Execute cashout
    const confirmBtn = screen.getByRole("button", {
      name: /Konfirmasi & Serahkan Uang Tunai/i,
    });
    fireEvent.click(confirmBtn);

    // Verify Regular UI Modal appears
    await waitFor(() => {
      expect(screen.getByText("Pencairan Tunai Berhasil!")).toBeDefined();
    });

    // Check modal contents
    expect(screen.getByText("#819201")).toBeDefined();
    expect(screen.getByText("Sisa Saldo Nasabah")).toBeDefined();

    // Click "Cetak Struk"
    const printBtn = screen.getByRole("button", { name: /Cetak Struk/i });
    fireEvent.click(printBtn);

    expect(printSpy).toHaveBeenCalled();
    const calledElement = printSpy.mock.calls[0][0];
    expect(calledElement.id).toBe("cashout-thermal-receipt");

    printSpy.mockRestore();
  });

  it("renders waste categories grouped by material group in dropdown", async () => {
    render(<CounterClient categories={mockCategories} />);

    const combobox = screen.getByRole("combobox");
    expect(combobox).toBeDefined();

    // Click to open dropdown
    fireEvent.click(combobox);

    // Group labels should be present
    expect(screen.getByText("Plastik")).toBeDefined();
    expect(screen.getByText("Kertas")).toBeDefined();

    // Options under the groups should be present
    expect(screen.getByText("Botol PET")).toBeDefined();
    expect(screen.getByText("Rp 4.000 / kg")).toBeDefined();
    expect(screen.getAllByText("Kardus Bekas").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Rp 2.500 / kg").length).toBeGreaterThanOrEqual(1);

    // Selecting an option updates selection
    const botolOption = screen.getByRole("option", { name: /Botol PET/i });
    fireEvent.click(botolOption);

    // After clicking, Botol PET is now selected in combobox
    expect(combobox).toHaveTextContent("Botol PET");
  });

  it("renders transaction history with month calendar filter and service type filter", async () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
    const currentYm = `${currentYear}-${currentMonth}`;

    const mockHistory = [
      {
        id: "hist-1",
        type: "drop_off",
        referenceCode: "TK-SEP01",
        clientName: "Budi Santoso",
        clientAccountNumber: "UKN-9988",
        amount: 25000,
        weight: 10,
        paymentMethod: "cash",
        status: "completed",
        createdAt: `${currentYm}-10T08:30:00.000Z`,
        items: [
          {
            categoryName: "Kardus Bekas",
            weight: 10,
            priceApplied: 2500,
            subtotal: 25000,
          },
        ],
      },
      {
        id: "hist-2",
        type: "cash_counter_withdrawal",
        referenceCode: "WD-SEP02",
        clientName: "Siti Aminah",
        clientAccountNumber: "UKN-7788",
        tokenCode: "991122",
        balance: 100000,
        amount: 50000,
        status: "completed",
        createdAt: `${currentYm}-12T09:15:00.000Z`,
      },
      {
        id: "hist-3",
        type: "drop_off",
        referenceCode: "TK-OLD01",
        clientName: "Ahmad Dahlan",
        clientAccountNumber: "UKN-1122",
        amount: 12000,
        weight: 3,
        paymentMethod: "balance",
        status: "completed",
        createdAt: "2025-01-15T14:00:00.000Z",
        items: [
          {
            categoryName: "Botol PET",
            weight: 3,
            priceApplied: 4000,
            subtotal: 12000,
          },
        ],
      },
    ];

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/counter/history")) {
        return Promise.resolve({
          json: () =>
            Promise.resolve({
              success: true,
              data: mockHistory,
            }),
        });
      }
      return Promise.resolve({
        json: () => Promise.resolve({ success: true, data: [] }),
      });
    }) as unknown as typeof fetch;

    render(<CounterClient categories={mockCategories} />);

    // Switch to Tab 3: Riwayat Loket
    const historyTab = screen.getByRole("button", { name: /Riwayat Loket/i });
    fireEvent.click(historyTab);

    // Wait for history to load
    await waitFor(() => {
      expect(screen.getByText("#TK-SEP01")).toBeDefined();
    });

    // Should show items in current month by default
    expect(screen.getByText("#WD-SEP02")).toBeDefined();
    // Older month item (from 2025-01) should NOT be displayed in current month view
    expect(screen.queryByText("#TK-OLD01")).toBeNull();

    // Summary stats for current month should be displayed
    expect(screen.getByText("Total Sampah Drop-off")).toBeDefined();
    expect(screen.getByText("10.0 kg")).toBeDefined();

    // Filter by type: Drop-off only
    const dropoffBtn = screen.getByRole("button", { name: /^Drop-off/i });
    fireEvent.click(dropoffBtn);
    expect(screen.getByText("#TK-SEP01")).toBeDefined();
    expect(screen.queryByText("#WD-SEP02")).toBeNull();

    // Filter by type: Tarik Tunai only
    const cashoutBtn = screen.getByRole("button", { name: /^Tarik Tunai/i });
    fireEvent.click(cashoutBtn);
    expect(screen.queryByText("#TK-SEP01")).toBeNull();
    expect(screen.getByText("#WD-SEP02")).toBeDefined();

    // Switch back to "Semua"
    const allBtn = screen.getByRole("button", { name: /^Semua/i });
    fireEvent.click(allBtn);
    expect(screen.getByText("#TK-SEP01")).toBeDefined();
    expect(screen.getByText("#WD-SEP02")).toBeDefined();
  });
});
