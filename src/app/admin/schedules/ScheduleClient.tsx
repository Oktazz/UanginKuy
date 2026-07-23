"use client";

import { useState } from "react";
import { Edit2, Trash2, Plus, X, Calendar as CalendarIcon, Clock, CheckCircle, XCircle } from "lucide-react";
import { addSchedule, updateSchedule, deleteSchedule } from "./actions";

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default function ScheduleClient({ schedules }: { schedules: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeItem, setActiveItem] = useState<any>(null);

  const openAddModal = () => {
    setIsEditMode(false);
    setActiveItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setIsEditMode(true);
    setActiveItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async (formData: FormData) => {
    try {
      if (isEditMode) {
        await updateSchedule(formData);
      } else {
        await addSchedule(formData);
      }
      closeModal();
    } catch (error: any) {
      alert(error.message || "Gagal menyimpan jadwal");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Manajemen Jadwal</h2>
          <p className="text-gray-500 mt-2 font-medium">Atur hari operasional penjemputan dan batas waktu pesanan.</p>
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
                <th className="px-6 py-4 font-bold text-gray-500 text-sm uppercase tracking-wider">Hari Operasional</th>
                <th className="px-6 py-4 font-bold text-gray-500 text-sm uppercase tracking-wider">Cut-off Time</th>
                <th className="px-6 py-4 font-bold text-gray-500 text-sm uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-bold text-gray-500 text-sm uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {schedules.map((schedule) => (
                <tr key={schedule.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-3 text-gray-900 font-bold">
                       <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                          <CalendarIcon size={18} />
                       </div>
                       <span>{DAYS[schedule.day_of_week]}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-2 font-medium text-gray-600">
                       <Clock size={16} className="text-gray-400" />
                       <span>{schedule.cut_off_time.substring(0,5)} WIB</span>
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
                    <form action={deleteSchedule}>
                      <input type="hidden" name="id" value={schedule.id} />
                      <button 
                        type="submit"
                        className="p-2 text-gray-400 hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                        onClick={(e) => {
                          if (!confirm('Yakin ingin menghapus jadwal ini?')) e.preventDefault();
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {schedules.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
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
                {isEditMode ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form action={handleSubmit}>
              {isEditMode && <input type="hidden" name="id" value={activeItem?.id} />}
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Hari Operasional</label>
                  <select 
                    name="day_of_week" 
                    required 
                    defaultValue={activeItem?.day_of_week ?? ''}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  >
                    <option value="" disabled>Pilih Hari</option>
                    {DAYS.map((day, index) => (
                      <option key={index} value={index}>{day}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Batas Waktu Pesanan (Cut-off Time)</label>
                  <input 
                    type="time" 
                    name="cut_off_time" 
                    required 
                    defaultValue={activeItem?.cut_off_time || '10:00'}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Status Aktif</label>
                  <select 
                    name="is_active" 
                    defaultValue={activeItem?.is_active === false ? "false" : "true"}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  >
                    <option value="true">Aktif (Tersedia untuk Booking)</option>
                    <option value="false">Nonaktif (Libur)</option>
                  </select>
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
    </div>
  );
}
