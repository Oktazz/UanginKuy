// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import WithdrawalClient from "@/app/(nasabah)/withdrawal/_components/WithdrawalClient";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}));

// Mock window.scrollTo
beforeEach(() => {
  window.scrollTo = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const mockBanks = [
  { code: "bca", name: "Bank Central Asia" },
  { code: "bri", name: "Bank Rakyat Indonesia" },
];

const mockWithdrawals = [
  {
    id: "w-1",
    user_id: "u-1",
    amount: 50000,
    fee: 0,
    net_amount: 50000,
    status: "pending" as const,
    bank_code: "TUNAI_LOKET",
    bank_name: "TUNAI_LOKET",
    account_number: "889900",
    token_code: "889900",
    withdrawal_type: "cash_counter",
    token_expires_at: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
    created_at: new Date().toISOString(),
  },
];

describe("WithdrawalClient Component Decomposition", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/withdrawals/banks")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                banks: mockBanks,
                fee: 2500,
                environment: "test",
              },
            }),
        });
      }
      if (url.includes("/api/withdrawals/counter-token")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: null,
            }),
        });
      }
      if (url.includes("/api/withdrawals")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: mockWithdrawals,
            }),
        });
      }
      return Promise.reject(new Error(`Unhandled request: ${url}`));
    });
  });

  it("renders balance header and defaults to bank transfer tab", async () => {
    render(<WithdrawalClient currentBalance={150000} />);

    expect(screen.getByText("Saldo tersedia")).toBeInTheDocument();
    expect(screen.getByText("Rp 150.000")).toBeInTheDocument();
    expect(screen.getByText("Transfer Bank Otomatis")).toBeInTheDocument();

    // Verify history section renders
    await waitFor(() => {
      expect(screen.getByText("Riwayat penarikan")).toBeInTheDocument();
      expect(screen.getByText("Token Aktif (Siap Dicairkan)")).toBeInTheDocument();
    });
  });

  it("switches to counter cashout tab and displays counter cashout form", async () => {
    render(<WithdrawalClient currentBalance={150000} />);

    const counterTabBtn = screen.getByRole("button", { name: /Tarik Tunai di Loket/i });
    fireEvent.click(counterTabBtn);

    expect(screen.getByText("Tarik Tunai di Loket Bank Sampah")).toBeInTheDocument();
    expect(screen.getByLabelText("Nominal Penarikan Tunai")).toBeInTheDocument();
    expect(screen.getByText("Dapatkan Kode Tarik Tunai")).toBeInTheDocument();
  });

  it("switches to active counter token view when clicking 'Lihat QR & Detail' in history", async () => {
    render(<WithdrawalClient currentBalance={150000} />);

    await waitFor(() => {
      expect(screen.getByText("Lihat QR & Detail")).toBeInTheDocument();
    });

    const viewDetailBtn = screen.getByText("Lihat QR & Detail");
    fireEvent.click(viewDetailBtn);

    await waitFor(() => {
      expect(screen.getByText("Token Siap Dicairkan")).toBeInTheDocument();
      expect(screen.getByText("Tunjukkan Kode Ini ke Petugas Loket:")).toBeInTheDocument();
      expect(screen.getByText("Batalkan & Kembalikan Saldo")).toBeInTheDocument();
    });
  });
});
