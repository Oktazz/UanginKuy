"use client";

import { useState } from "react";
import {
  Edit2,
  Trash2,
  Plus,
  X,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { CustomAlertDialog } from "@/components/ui/ConfirmDialog";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { addSchedule, updateSchedule, deleteSchedule } from "./actions";
import type { Database } from "@/types/supabase";

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const getDayName = (day: number | null) =>
  day === null ? "Hari belum diatur" : DAYS[day];

type Schedule = Database["public"]["Tables"]["schedules"]["Row"];

export default function ScheduleClient({
  schedules,
}: {
  schedules: Schedule[];
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeItem, setActiveItem] = useState<Schedule | null>(null);
  const [scheduleToDelete, setScheduleToDelete] = useState<Schedule | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states for CustomSelect
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedActive, setSelectedActive] = useState<string>("true");
  const [formError, setFormError] = useState<string | null>(null);

  const openAddModal = () => {
    setIsEditMode(false);
    setActiveItem(null);
    setSelectedDay("");
    setSelectedActive("true");
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: Schedule) => {
    setIsEditMode(true);
    setActiveItem(item);
    setSelectedDay(item.day_of_week !== null ? String(item.day_of_week) : "");
    setSelectedActive(item.is_active === false ? "false" : "true");
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormError(null);
  };

  const handleSubmit = async (formData: FormData) => {
    if (!selectedDay) {
      setFormError("Silakan pilih hari operasional.");
      return;
    }

    try {
      setFormError(null);
      if (isEditMode) {
        await updateSchedule(formData);
      } else {
        await addSchedule(formData);
      }
      closeModal();
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : "Gagal menyimpan jadwal");
    }
  };

  const handleDelete = async () => {
    if (!scheduleToDelete) return;

    setIsDeleting(true);
    const formData = new FormData();
    formData.set("id", String(scheduleToDelete.id));

    try {
      await deleteSchedule(formData);
      setScheduleToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Manajemen Jadwal
          </h2>
          <p className="text-gray-500 mt-2 font-medium">
            Atur hari operasional penjemputan dan batas waktu pesanan.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center space-x-2 bg-primary text-white px-5 py-3 rounded-xl font-bold hover:bg-primary-dark transition-all shadow-sm"
        >
          <Plus size={20} />
          <span>Tambah Jadwal</span>
        </button>
      </div>

      <div className="bg-surface border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 font-bold text-gray-500 text-sm uppercase tracking-wider">
                  Hari Operasional
                </th>
                <th className="px-6 py-4 font-bold text-gray-500 text-sm uppercase tracking-wider">
                  Cut-off Time
                </th>
                <th className="px-6 py-4 font-bold text-gray-500 text-sm uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 font-bold text-gray-500 text-sm uppercase tracking-wider text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {schedules.map((schedule) => (
                <tr
                  key={schedule.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-3 text-gray-900 font-bold">
                      <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                        <CalendarIcon size={18} />
                      </div>
                      <span>{getDayName(schedule.day_of_week)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-2 font-medium text-gray-600">
                      <Clock size={16} className="text-gray-400" />
                      <span>{schedule.cut_off_time.substring(0, 5)} WIB</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {schedule.is_active ? (
                      <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-bold uppercase tracking-wider">
                        <CheckCircle size={14} /> <span>Aktif</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-error/10 text-error text-xs font-bold uppercase tracking-wider">
                        <XCircle size={14} /> <span>Nonaktif</span>
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5 flex justify-end space-x-3">
                    <button
                      onClick={() => openEditModal(schedule)}
                      className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Hapus jadwal ${getDayName(schedule.day_of_week)}`}
                      onClick={() => setScheduleToDelete(schedule)}
                      className="p-2 text-gray-400 hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {schedules.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    Belum ada data jadwal operasional.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-md rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">
                {isEditMode ? "Edit Jadwal" : "Tambah Jadwal Baru"}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form action={handleSubmit}>
              {isEditMode && (
                <input type="hidden" name="id" value={activeItem?.id} />
              )}
              <div className="p-6 space-y-5">
                {formError && (
                  <div className="bg-error/10 border border-error/20 rounded-xl p-3 text-xs text-error font-semibold flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="schedule-day-of-week"
                    className="block text-sm font-bold text-gray-700 mb-2"
                  >
                    Hari Operasional
                  </label>
                  <CustomSelect
                    id="schedule-day-of-week"
                    name="day_of_week"
                    value={selectedDay}
                    onChange={setSelectedDay}
                    options={DAYS.map((day, index) => ({
                      value: String(index),
                      label: day,
                    }))}
                    placeholder="Pilih Hari..."
                    triggerClassName="h-12 rounded-xl border-gray-200 bg-gray-50 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Batas Waktu Pesanan (Cut-off Time)
                  </label>
                  <input
                    type="time"
                    name="cut_off_time"
                    required
                    defaultValue={activeItem?.cut_off_time || "10:00"}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor="schedule-is-active"
                    className="block text-sm font-bold text-gray-700 mb-2"
                  >
                    Status Aktif
                  </label>
                  <CustomSelect
                    id="schedule-is-active"
                    name="is_active"
                    value={selectedActive}
                    onChange={setSelectedActive}
                    options={[
                      { value: "true", label: "Aktif (Tersedia untuk Booking)" },
                      { value: "false", label: "Nonaktif (Libur)" },
                    ]}
                    placeholder="Pilih Status..."
                    triggerClassName="h-12 rounded-xl border-gray-200 bg-gray-50 text-gray-900"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-bold text-white bg-primary hover:bg-primary-dark transition-colors shadow-sm"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CustomAlertDialog
        open={scheduleToDelete !== null}
        title="Hapus jadwal operasional?"
        description={`Jadwal hari ${scheduleToDelete ? getDayName(scheduleToDelete.day_of_week) : ""} akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.`}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setScheduleToDelete(null)}
      />
    </div>
  );
}
