"use client";

import React, { useEffect, useCallback } from "react";
import { Printer, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ThermalReceipt,
  type ThermalDropoffReceiptData,
  type ThermalCashoutReceiptData,
} from "./ThermalReceipt";
import { printThermalElement } from "@/utils/thermal-print";
import "./thermal-receipt.css";

interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "dropoff" | "cashout";
  data: ThermalDropoffReceiptData | ThermalCashoutReceiptData | null;
  unitName?: string;
  branchAddress?: string;
  npwp?: string;
  contactNumber?: string;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  isOpen,
  onClose,
  type,
  data,
  unitName,
  branchAddress,
  npwp,
  contactNumber,
}) => {
  const refCode =
    type === "dropoff"
      ? (data as ThermalDropoffReceiptData)?.ticketShortId ||
        (data as ThermalDropoffReceiptData)?.ticketId?.substring(0, 8) ||
        "dropoff"
      : (data as ThermalCashoutReceiptData)?.tokenCode ||
        (data as ThermalCashoutReceiptData)?.withdrawalId?.substring(0, 8) ||
        "tarik-tunai";

  const docTitle = `Struk-${type === "dropoff" ? "Setor" : "Tarik"}-${refCode}`;

  const handlePrint = useCallback(() => {
    const el = document.getElementById("thermal-receipt-print-area");
    if (!el) {
      window.print();
      return;
    }
    printThermalElement(el, { documentTitle: docTitle });
  }, [docTitle]);

  // Keyboard shortcut listener (Enter for print, Esc for close)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter" && !e.shiftKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          handlePrint();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handlePrint]);

  if (!isOpen || !data) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto print:bg-transparent print:p-0 print:static print:overflow-visible"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200 my-auto print:bg-transparent print:border-none print:shadow-none print:p-0 print:max-w-none print:w-auto">
        {/* Modal Top Bar (Hidden on print) */}
        <div className="flex items-center justify-between mb-4 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">
                Struk Transaksi Retail
              </h3>
              <p className="text-[11px] text-neutral-400">
                Format Thermal POS 58mm / 80mm
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Paper Container Preview (Looks like a real thermal paper roll) */}
        <div className="relative mx-auto max-w-[340px] bg-white rounded-md shadow-inner overflow-hidden border border-neutral-300 print:border-none print:shadow-none print:rounded-none">
          {/* Top Paper Serrated Edge Effect */}
          <div className="h-2 bg-neutral-200 border-b border-dashed border-neutral-400 print:hidden" />

          {/* Actual Thermal Receipt Content */}
          <div className="py-2 px-1 max-h-[60vh] overflow-y-auto sm:max-h-[68vh] scrollbar-thin scrollbar-thumb-neutral-300 print:max-h-none print:overflow-visible print:p-0">
            <ThermalReceipt
              type={type}
              data={data}
              unitName={unitName}
              branchAddress={branchAddress}
              npwp={npwp}
              contactNumber={contactNumber}
            />
          </div>

          {/* Bottom Paper Serrated Edge Effect */}
          <div className="h-2 bg-neutral-200 border-t border-dashed border-neutral-400 print:hidden" />
        </div>

        {/* Action Buttons (Hidden on print) */}
        <div className="mt-5 flex gap-2.5 print:hidden">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 rounded-xl font-bold border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800 cursor-pointer h-11 text-xs"
          >
            Tutup (Esc)
          </Button>
          <Button
            type="button"
            onClick={handlePrint}
            className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold cursor-pointer transition shadow-sm h-11 text-xs inline-flex items-center justify-center gap-1.5"
          >
            <Printer size={16} />
            Cetak / Simpan PDF (Enter)
          </Button>
        </div>
      </div>
    </div>
  );
};
