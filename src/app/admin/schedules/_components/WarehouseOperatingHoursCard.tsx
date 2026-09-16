"use client";

import { useState } from "react";
import {
  Clock,
  Save,
  CheckCircle,
  AlertCircle,
  Store,
  Eye,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  saveWarehouseOperatingHours,
  type WarehouseOperatingHoursInput,
} from "../actions";

interface WarehouseOperatingHoursCardProps {
  initialData: WarehouseOperatingHoursInput | null;
}

export function WarehouseOperatingHoursCard({
  initialData,
}: WarehouseOperatingHoursCardProps) {
  const [openTime, setOpenTime] = useState(initialData?.openTime || "08:00");
  const [closeTime, setCloseTime] = useState(initialData?.closeTime || "16:00");
  const [daysLabel, setDaysLabel] = useState(
    initialData?.daysLabel || "Senin - Sabtu"
  );
  const [notes, setNotes] = useState(
    initialData?.notes || "Istirahat loket: 12.00 - 13.00 WIB"
  );
  const [isActive, setIsActive] = useState(
    initialData?.isActive !== undefined ? initialData.isActive : true
  );

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      await saveWarehouseOperatingHours({
        openTime,
        closeTime,
        daysLabel,
        notes: notes.trim() || undefined,
        isActive,
      });
      setFeedback({
        kind: "success",
        message: "Jadwal operasional bank sampah berhasil disimpan!",
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menyimpan jadwal.";
      setFeedback({
        kind: "error",
        message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formattedHours = `${openTime.replace(":", ".")} - ${closeTime.replace(":", ".")} WIB`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Store size={22} className="text-primary" />
            Pengaturan Jam Buka Bank Sampah
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Atur jam buka dan hari operasional loket bank sampah untuk nasabah yang mengantar sampah langsung (walk-in).
          </p>
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          className={`p-4 rounded-2xl flex items-start space-x-3 text-sm font-semibold border animate-in fade-in duration-200 ${
            feedback.kind === "success"
              ? "bg-success/10 border-success/20 text-success"
              : "bg-error/10 border-error/20 text-error"
          }`}
        >
          {feedback.kind === "success" ? (
            <CheckCircle className="shrink-0 mt-0.5" size={18} />
          ) : (
            <AlertCircle className="shrink-0 mt-0.5" size={18} />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Configuration */}
        <div className="lg:col-span-7 bg-surface border border-gray-100 rounded-3xl p-6 sm:p-7 shadow-xs">
          <form onSubmit={handleSave} className="space-y-5">
            {/* Status Switch */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <div>
                <span className="text-sm font-bold text-gray-900 block">Status Operasional Loket</span>
                <span className="text-xs text-gray-500">
                  {isActive ? "Loket menerima setoran antar langsung" : "Loket sedang tutup sementara"}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* Jam Buka & Jam Tutup */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                  Jam Buka Loket
                </label>
                <div className="relative">
                  <input
                    type="time"
                    required
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                  Jam Tutup Loket
                </label>
                <div className="relative">
                  <input
                    type="time"
                    required
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Hari Operasional */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                Hari Operasional
              </label>
              <input
                type="text"
                required
                value={daysLabel}
                onChange={(e) => setDaysLabel(e.target.value)}
                placeholder="Contoh: Senin - Sabtu atau Senin - Jumat"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {["Senin - Sabtu", "Senin - Jumat", "Setiap Hari"].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDaysLabel(preset)}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Catatan Operasional */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                Catatan Tambahan (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Istirahat loket: 12.00 - 13.00 WIB"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                loading={isSaving}
                loadingLabel="Menyimpan..."
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save size={18} />
                <span>Simpan Pengaturan Jam Buka</span>
              </Button>
            </div>
          </form>
        </div>

        {/* Live Preview for Nasabah */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
            <Eye size={15} />
            <span>Tampilan di Aplikasi Nasabah</span>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm">
                <Store size={20} />
              </div>
              <div>
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary mb-1">
                  Preview Kartu Antar Langsung
                </span>
                <h4 className="font-extrabold text-gray-900 text-sm">Gudang & Depo Utama UanginKuy</h4>
              </div>
            </div>

            <div className="bg-white/95 p-3.5 rounded-2xl border border-emerald-100 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                <Clock size={16} />
                <span>Jam Operasional {daysLabel ? `(${daysLabel})` : ""}</span>
              </div>
              <p className="text-base font-black text-gray-900 font-mono">
                {formattedHours}
              </p>
              {notes && (
                <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 p-2 rounded-xl border border-gray-100">
                  <Info size={13} className="text-emerald-600 shrink-0" />
                  <span className="line-clamp-2">{notes}</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-emerald-800/80">
              💡 Perubahan yang Anda simpan akan langsung terlihat oleh semua nasabah saat membuka tab Antar ke Bank Sampah di halaman Booking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
