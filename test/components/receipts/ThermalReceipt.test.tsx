// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { ThermalReceipt } from "@/components/receipts/ThermalReceipt";
import { ThermalReceiptModal } from "@/components/receipts/ThermalReceiptModal";
import * as thermalPrintModule from "@/utils/thermal-print";

afterEach(cleanup);

describe("ThermalReceipt Component", () => {
  it("renders dropoff receipt with authentic Indomaret retail layout and items breakdown", () => {
    const mockDropoffData = {
      ticketId: "ticket-uuid-123456",
      ticketShortId: "TK-DROP01",
      clientName: "Budi Santoso",
      clientAccountNumber: "UKN-998811",
      paymentMethod: "cash" as const,
      totalWeight: 5.5,
      totalAmount: 25000,
      carbonSaved: 4.4,
      completedAt: "2026-09-17T10:30:00.000Z",
      cashierName: "Alia Kasir",
      items: [
        {
          categoryName: "Kardus Bekas A",
          weight: 3.5,
          priceApplied: 3000,
          subtotal: 10500,
        },
        {
          categoryName: "Botol Plastik PET",
          weight: 2.0,
          priceApplied: 7250,
          subtotal: 14500,
        },
      ],
    };

    render(<ThermalReceipt type="dropoff" data={mockDropoffData} />);

    // Header inspection
    expect(screen.getByText("PT. BANK SAMPAH UANGINKUY")).toBeDefined();
    expect(screen.getByText("UANGINKUY")).toBeDefined();
    expect(screen.getByText("UNIT LOKET PUSAT & RECYCLE")).toBeDefined();

    // Client & Cashier info
    expect(screen.getByText("REF: #TK-DROP01")).toBeDefined();
    expect(screen.getByText("BUDI SANTOSO")).toBeDefined();
    expect(screen.getByText("REK: UKN-998811")).toBeDefined();

    // Itemized lines
    expect(screen.getByText("Kardus Bekas A")).toBeDefined();
    expect(screen.getByText("Botol Plastik PET")).toBeDefined();
    expect(screen.getByText("10.500")).toBeDefined();
    expect(screen.getByText("14.500")).toBeDefined();

    // Environmental metrics & totals
    expect(screen.getByText("5.50 KG")).toBeDefined();
    expect(screen.getByText("Rp 25.000")).toBeDefined();
    expect(screen.getByText("TUNAI LANGSUNG")).toBeDefined();

    // Footer
    expect(screen.getByText("TERIMA KASIH")).toBeDefined();
    expect(screen.getByText("SIMPAN STRUK SEBAGAI BUKTI SAH")).toBeDefined();
  });

  it("renders cashout (penarikan tunai) receipt with remaining balance", () => {
    const mockCashoutData = {
      withdrawalId: "with-uuid-7890",
      tokenCode: "819201",
      amount: 50000,
      clientName: "Siti Aminah",
      clientAccountNumber: "UKN-112233",
      remainingBalance: 125000,
      cashierName: "Kasir Loket 1",
      completedAt: "2026-09-17T11:00:00.000Z",
    };

    render(<ThermalReceipt type="cashout" data={mockCashoutData} />);

    expect(screen.getByText("REF: #819201")).toBeDefined();
    expect(screen.getByText("SITI AMINAH")).toBeDefined();
    expect(screen.getByText("REK: UKN-112233")).toBeDefined();
    expect(screen.getByText("PENARIKAN TUNAI KASIR")).toBeDefined();
    expect(screen.getByText("BIAYA ADMIN LOKET")).toBeDefined();
    expect(screen.getAllByText("Rp 50.000").length).toBe(2);
    expect(screen.getByText("SISA SALDO NASABAH")).toBeDefined();
    expect(screen.getByText("Rp 125.000")).toBeDefined();
  });
});

describe("ThermalReceiptModal Component", () => {
  it("renders modal preview with print button and closes on ESC or button click", () => {
    const onClose = vi.fn();
    const printSpy = vi
      .spyOn(thermalPrintModule, "printThermalElement")
      .mockReturnValue(true);

    const mockDropoffData = {
      ticketId: "ticket-123",
      clientName: "Rudi",
      paymentMethod: "balance" as const,
      totalWeight: 2,
      totalAmount: 10000,
      carbonSaved: 1.6,
      completedAt: new Date().toISOString(),
    };

    const { rerender } = render(
      <ThermalReceiptModal
        isOpen={true}
        onClose={onClose}
        type="dropoff"
        data={mockDropoffData}
      />
    );

    expect(screen.getByText("Struk Transaksi Retail")).toBeDefined();
    expect(screen.getByText(/Cetak \/ Simpan PDF/i)).toBeDefined();

    // Trigger Print
    fireEvent.click(screen.getByText(/Cetak \/ Simpan PDF/i));
    expect(printSpy).toHaveBeenCalled();

    // Trigger Close via button
    fireEvent.click(screen.getByText(/Tutup/i));
    expect(onClose).toHaveBeenCalled();

    // Not rendered when isOpen is false
    rerender(
      <ThermalReceiptModal
        isOpen={false}
        onClose={onClose}
        type="dropoff"
        data={mockDropoffData}
      />
    );
    expect(screen.queryByText("Struk Transaksi Retail")).toBeNull();

    printSpy.mockRestore();
  });
});

describe("printThermalElement Utility", () => {
  it("creates an isolated print iframe in document.body and injects content", () => {
    const div = document.createElement("div");
    div.id = "thermal-receipt-print-area";
    div.innerHTML = "<span>Bank Sampah Receipt</span>";
    document.body.appendChild(div);

    const result = thermalPrintModule.printThermalElement(div, {
      documentTitle: "Test-Struk",
    });
    expect(result).toBe(true);

    const iframe = document.getElementById("thermal-print-frame");
    expect(iframe).not.toBeNull();

    document.body.removeChild(div);
  });
});
