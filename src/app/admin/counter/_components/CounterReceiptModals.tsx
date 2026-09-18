"use client";

import { useEffect } from "react";
import { X, CheckCircle2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThermalReceipt } from "@/components/receipts/ThermalReceipt";
import { printThermalElement } from "@/utils/thermal-print";
import { formatIDR } from "@/utils/format";
import type {
  DropoffTransactionResult,
  CounterWithdrawalVerification,
} from "@/types/counter";

export interface WarehouseInfo {
  name?: string;
  address?: string;
  phone?: string;
}

interface CounterReceiptModalsProps {
  dropoffResult: DropoffTransactionResult | null;
  onCloseDropoff: () => void;
  cashoutReceipt: CounterWithdrawalVerification | null;
  onCloseCashout: () => void;
  warehouseInfo: WarehouseInfo | null;
}

export function CounterReceiptModals({
  dropoffResult,
  onCloseDropoff,
  cashoutReceipt,
  onCloseCashout,
  warehouseInfo,
}: CounterReceiptModalsProps) {
  // Print handlers for thermal receipts (only triggers on print action)
  const handlePrintDropoff = () => {
    const el = document.getElementById("dropoff-thermal-receipt");
    if (!el) return;
    const refCode =
      dropoffResult?.ticketShortId ||
      dropoffResult?.ticketId.substring(0, 8).toUpperCase() ||
      "LOKET";
    printThermalElement(el, {
      documentTitle: `Struk-Setor-${refCode}`,
    });
  };

  const handlePrintCashout = () => {
    const el = document.getElementById("cashout-thermal-receipt");
    if (!el) return;
    const refCode =
      cashoutReceipt?.tokenCode ||
      cashoutReceipt?.withdrawalId.substring(0, 8).toUpperCase() ||
      "KASIR";
    printThermalElement(el, {
      documentTitle: `Struk-Tarik-${refCode}`,
    });
  };

  // Keyboard shortcut listener (Enter for print, Esc for close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (dropoffResult) onCloseDropoff();
        if (cashoutReceipt) onCloseCashout();
      } else if (e.key === "Enter" && !e.shiftKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          if (dropoffResult) {
            e.preventDefault();
            handlePrintDropoff();
          } else if (cashoutReceipt) {
            e.preventDefault();
            handlePrintCashout();
          }
        }
      }
    };

    if (dropoffResult || cashoutReceipt) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [dropoffResult, cashoutReceipt, onCloseDropoff, onCloseCashout]);

  return (
    <>
      {/* ========================================================================= */}
      {/* MODAL STRUK DROPOFF SUKSES (UI BIASA) */}
      {/* ========================================================================= */}
      {dropoffResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 duration-200 my-auto">
            <button
              type="button"
              onClick={onCloseDropoff}
              className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              title="Tutup"
            >
              <X size={20} />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={32} />
            </div>

            <h3 className="text-xl font-extrabold text-gray-900 text-center">
              Drop-off Selesai!
            </h3>
            <p className="text-xs text-gray-500 text-center mt-1 mb-5">
              Struk bukti transaksi penimbangan & drop-off sampah loket.
            </p>

            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 sm:p-5 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">No. Tiket</span>
                <span className="font-mono font-bold text-gray-900 bg-white border border-gray-200 px-2 py-0.5 rounded-md">
                  #{dropoffResult.ticketShortId || dropoffResult.ticketId.substring(0, 8).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Nama Nasabah</span>
                <div className="text-right">
                  <span className="font-bold text-gray-900 block">{dropoffResult.clientName}</span>
                  {dropoffResult.clientAccountNumber && (
                    <span className="font-mono text-[10px] text-gray-400 block">
                      {dropoffResult.clientAccountNumber}
                    </span>
                  )}
                </div>
              </div>

              {/* Rincian Item Sampah jika ada */}
              {dropoffResult.items && dropoffResult.items.length > 0 && (
                <div className="pt-2 border-t border-gray-200/80">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Rincian Sampah Ditimbang
                  </span>
                  <div className="space-y-1.5 bg-white p-2.5 rounded-xl border border-gray-200 max-h-36 overflow-y-auto">
                    {dropoffResult.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[11px]">
                        <div>
                          <span className="font-semibold text-gray-800">{it.categoryName}</span>
                          <span className="text-gray-400 block text-[10px]">
                            {it.weight.toFixed(2)} kg × {formatIDR.format(it.priceApplied)}
                          </span>
                        </div>
                        <span className="font-bold text-gray-900">
                          {formatIDR.format(it.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-1 border-t border-gray-200/80">
                <span className="text-gray-500">Total Berat</span>
                <span className="font-bold text-emerald-700">{dropoffResult.totalWeight.toFixed(2)} kg</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Jejak Karbon Dikurangi</span>
                <span className="font-bold text-emerald-700">~{dropoffResult.carbonSaved.toFixed(1)} kg CO₂e</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Metode Pembayaran</span>
                <span className="font-extrabold uppercase text-gray-900 inline-flex items-center px-2 py-0.5 rounded-md bg-white border border-gray-200">
                  {dropoffResult.paymentMethod === "cash" ? "Tunai / Cash Langsung" : "Masuk Saldo UanginKuy"}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2.5 flex justify-between items-center text-sm font-extrabold text-gray-900">
                <span>Total Pembayaran</span>
                <span className="text-emerald-700 text-lg font-black">{formatIDR.format(dropoffResult.totalAmount)}</span>
              </div>
            </div>

            {/* Hidden thermal receipt DOM for isolated printing */}
            <div id="dropoff-thermal-receipt" className="hidden">
              <ThermalReceipt
                type="dropoff"
                data={{
                  ticketId: dropoffResult.ticketId,
                  ticketShortId: dropoffResult.ticketShortId,
                  clientName: dropoffResult.clientName,
                  clientAccountNumber: dropoffResult.clientAccountNumber,
                  paymentMethod: dropoffResult.paymentMethod,
                  totalWeight: dropoffResult.totalWeight,
                  totalAmount: dropoffResult.totalAmount,
                  carbonSaved: dropoffResult.carbonSaved,
                  completedAt: dropoffResult.completedAt,
                  cashierName: dropoffResult.cashierName,
                  items: dropoffResult.items,
                }}
                unitName={warehouseInfo?.name ? warehouseInfo.name.toUpperCase() : undefined}
                branchAddress={warehouseInfo?.address ? warehouseInfo.address.toUpperCase() : undefined}
                contactNumber={warehouseInfo?.phone || undefined}
              />
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrintDropoff}
                className="flex-1 rounded-xl font-bold border-gray-200 text-gray-700 cursor-pointer hover:bg-gray-50 h-11"
              >
                <Printer size={16} className="mr-1.5" />
                Cetak Struk (Enter)
              </Button>
              <Button
                type="button"
                onClick={onCloseDropoff}
                className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold cursor-pointer transition shadow-sm h-11"
              >
                Selesai (Esc)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL STRUK TARIK TUNAI SUKSES (UI BIASA) */}
      {/* ========================================================================= */}
      {cashoutReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 duration-200 my-auto">
            <button
              type="button"
              onClick={onCloseCashout}
              className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              title="Tutup"
            >
              <X size={20} />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={32} />
            </div>

            <h3 className="text-xl font-extrabold text-gray-900 text-center">
              Pencairan Tunai Berhasil!
            </h3>
            <p className="text-xs text-gray-500 text-center mt-1 mb-5">
              Struk bukti penyerahan uang fisik di loket bank sampah.
            </p>

            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 sm:p-5 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Kode Token OTP</span>
                <span className="font-mono font-black text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-md text-sm">
                  #{cashoutReceipt.tokenCode}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">No. Referensi Transaksi</span>
                <span className="font-mono font-bold text-gray-900 bg-white border border-gray-200 px-2 py-0.5 rounded-md">
                  #{cashoutReceipt.withdrawalId.substring(0, 8).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Nama Nasabah</span>
                <span className="font-bold text-gray-900">{cashoutReceipt.client.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Member ID Nasabah</span>
                <span className="font-mono text-gray-700">
                  {cashoutReceipt.client.account_number || "UKN-MEMBER"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Jenis Layanan</span>
                <span className="font-bold uppercase text-gray-900">💵 Kasir Tarik Tunai</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Biaya Admin Loket</span>
                <span className="font-bold text-emerald-700">Gratis (Rp 0)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Waktu Penyerahan</span>
                <span className="font-medium text-gray-700">
                  {new Date().toLocaleString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })} WIB
                </span>
              </div>
              {cashoutReceipt.client.balance !== null && cashoutReceipt.client.balance !== undefined && (
                <div className="flex justify-between items-center pt-2 border-t border-gray-200/80">
                  <span className="text-gray-500">Sisa Saldo Nasabah</span>
                  <span className="font-bold text-gray-900">{formatIDR.format(cashoutReceipt.client.balance)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2.5 flex justify-between items-center text-sm font-extrabold text-gray-900">
                <span>Total Uang Diserahkan</span>
                <span className="text-emerald-700 text-lg font-black">{formatIDR.format(cashoutReceipt.amount)}</span>
              </div>
            </div>

            {/* Hidden thermal receipt DOM for isolated printing */}
            <div id="cashout-thermal-receipt" className="hidden">
              <ThermalReceipt
                type="cashout"
                data={{
                  withdrawalId: cashoutReceipt.withdrawalId,
                  tokenCode: cashoutReceipt.tokenCode,
                  amount: cashoutReceipt.amount,
                  clientName: cashoutReceipt.client.name,
                  clientAccountNumber: cashoutReceipt.client.account_number,
                  remainingBalance: cashoutReceipt.client.balance,
                  cashierName: "Kasir Loket",
                  completedAt: new Date().toISOString(),
                }}
                unitName={warehouseInfo?.name ? warehouseInfo.name.toUpperCase() : undefined}
                branchAddress={warehouseInfo?.address ? warehouseInfo.address.toUpperCase() : undefined}
                contactNumber={warehouseInfo?.phone || undefined}
              />
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrintCashout}
                className="flex-1 rounded-xl font-bold border-gray-200 text-gray-700 cursor-pointer hover:bg-gray-50 h-11"
              >
                <Printer size={16} className="mr-1.5" />
                Cetak Struk (Enter)
              </Button>
              <Button
                type="button"
                onClick={onCloseCashout}
                className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold cursor-pointer transition shadow-sm h-11"
              >
                Selesai (Esc)
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
