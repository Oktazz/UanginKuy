"use client";

import { useState, useId, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, AlertCircle, X, XCircle } from "lucide-react";
import { cancelTicket } from "./actions";
import { Button } from "@/components/ui/button";

interface CancelTicketDialogProps {
  ticketId: string;
  shortId?: string | null;
  currentStatus: string;
  courierName?: string | null;
  className?: string;
}

const CANCELLATION_REASONS = [
  "Jadwal bentrok / Sedang tidak ada orang di rumah",
  "Sampah daur ulang belum siap / belum dipilah",
  "Salah memasukkan tanggal atau alamat penjemputan",
  "Ingin menjadwalkan ulang di hari lain",
  "Lainnya",
];

export function CancelTicketDialog({
  ticketId,
  shortId,
  currentStatus,
  courierName,
  className = "",
}: CancelTicketDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState(CANCELLATION_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const titleId = useId();
  const descId = useId();

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting]);

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Only allowed to cancel when pending or scheduled
  const canCancel = currentStatus === "pending" || currentStatus === "scheduled";
  if (!canCancel) return null;

  const handleOpenDialog = () => {
    setErrorMessage(null);
    setSelectedReason(CANCELLATION_REASONS[0]);
    setCustomReason("");
    setIsOpen(true);
  };

  const handleConfirmCancel = async () => {
    const finalReason =
      selectedReason === "Lainnya"
        ? customReason.trim() || "Alasan lainnya tidak disebutkan"
        : selectedReason;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await cancelTicket(ticketId, finalReason);

      if (!result.success) {
        setErrorMessage(result.error || "Gagal membatalkan jadwal. Silakan coba lagi.");
        setIsSubmitting(false);
        return;
      }

      setIsOpen(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      setErrorMessage("Terjadi kesalahan jaringan. Silakan coba beberapa saat lagi.");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleOpenDialog}
        className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-error/30 text-error hover:bg-error/10 active:scale-95 font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${className}`}
        aria-label="Batalkan jadwal penjemputan"
      >
        <XCircle size={16} />
        <span>Batalkan Penjemputan</span>
      </button>

      {/* Confirmation Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => !isSubmitting && setIsOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 w-full max-w-md space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-error/10 text-error flex items-center justify-center shrink-0">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 id={titleId} className="font-bold text-gray-900 text-lg leading-tight">
                    Batalkan Penjemputan?
                  </h3>
                  <p id={descId} className="text-xs text-gray-500 mt-0.5">
                    Tiket #{shortId || ticketId.substring(0, 8).toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsOpen(false)}
                aria-label="Tutup dialog"
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Warning if courier already assigned */}
            {currentStatus === "scheduled" && (
              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
                <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block">Kurir Telah Dijadwalkan</strong>
                  {courierName ? (
                    <span>
                      Kurir <strong>{courierName}</strong> sudah ditugaskan untuk rute ini.
                      Pembatalan akan otomatis mencabut titik jemput dari rute kurir.
                    </span>
                  ) : (
                    <span>Jadwal penjemputan ini sudah terkonfirmasi di rute kurir hari ini.</span>
                  )}
                </div>
              </div>
            )}

            {/* Reason Selection */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Pilih Alasan Pembatalan
              </label>

              <div className="space-y-2">
                {CANCELLATION_REASONS.map((reason) => {
                  const isSelected = selectedReason === reason;
                  return (
                    <label
                      key={reason}
                      className={`flex items-center space-x-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 text-gray-900 font-semibold ring-1 ring-primary/20"
                          : "border-gray-200 hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="cancellation_reason"
                        value={reason}
                        checked={isSelected}
                        onChange={() => setSelectedReason(reason)}
                        className="w-4 h-4 text-primary focus:ring-primary/20 border-gray-300"
                      />
                      <span className="flex-1">{reason}</span>
                    </label>
                  );
                })}
              </div>

              {/* Custom reason input */}
              {selectedReason === "Lainnya" && (
                <div className="pt-1">
                  <textarea
                    rows={2}
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Tuliskan alasan pembatalan Anda..."
                    className="w-full rounded-xl border border-gray-200 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    required
                  />
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-error/10 border border-error/20 rounded-xl p-3 text-xs text-error font-medium flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <Button
                type="button"
                variant="ghost"
                disabled={isSubmitting}
                onClick={() => setIsOpen(false)}
                className="flex-1 rounded-xl bg-gray-100 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              >
                Kembali
              </Button>

              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirmCancel}
                loading={isSubmitting}
                loadingLabel="Membatalkan..."
                className="flex-1 rounded-xl bg-error px-4 py-3 font-bold text-white shadow-md hover:bg-error/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Ya, Batalkan
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
