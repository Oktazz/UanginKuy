"use client";

import { useState } from "react";
import { Edit2, Trash2, Plus, X } from "lucide-react";
import { addCategory, updateCategory, deleteCategory } from "./actions";

export default function PriceClient({ categories }: { categories: any[] }) {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Manajemen Harga</h2>
          <p className="text-gray-500 mt-2 font-medium">Atur kategori sampah, harga per kg, dan faktor emisi karbon.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center space-x-2 bg-primary text-white px-5 py-3 rounded-xl font-bold hover:bg-primary-dark transition-all shadow-sm"
        >
          <Plus size={20} />
          <span>Tambah Kategori</span>
        </button>
      </div>

      <div className="bg-surface border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 font-bold text-gray-500 text-sm uppercase tracking-wider">Kategori</th>
                <th className="px-6 py-4 font-bold text-gray-500 text-sm uppercase tracking-wider">Harga / Kg</th>
                <th className="px-6 py-4 font-bold text-gray-500 text-sm uppercase tracking-wider">Faktor Karbon</th>
                <th className="px-6 py-4 font-bold text-gray-500 text-sm uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-5 font-bold text-gray-900">{cat.name}</td>
                  <td className="px-6 py-5 font-medium text-gray-900">Rp {cat.price_per_kg.toLocaleString('id-ID')}</td>
                  <td className="px-6 py-5 font-medium text-gray-500">{cat.carbon_factor} kg CO2e</td>
                  <td className="px-6 py-5 flex justify-end space-x-3">
                    <button 
                      onClick={() => openEditModal(cat)}
                      className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <form action={deleteCategory}>
                      <input type="hidden" name="id" value={cat.id} />
                      <button 
                        type="submit"
                        className="p-2 text-gray-400 hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                        onClick={(e) => {
                          if (!confirm('Yakin ingin menghapus kategori ini?')) e.preventDefault();
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    Belum ada data kategori sampah.
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
                {isEditMode ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form action={isEditMode ? updateCategory : addCategory} onSubmit={() => setTimeout(closeModal, 100)}>
              {isEditMode && <input type="hidden" name="id" value={activeItem?.id} />}
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nama Kategori</label>
                  <input 
                    type="text" 
                    name="name" 
                    required 
                    defaultValue={activeItem?.name || ''}
                    placeholder="Contoh: Plastik PET"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Harga per Kg (Rp)</label>
                  <input 
                    type="number" 
                    name="price_per_kg" 
                    required 
                    defaultValue={activeItem?.price_per_kg || ''}
                    placeholder="Contoh: 2500"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Faktor Karbon (kg CO2e)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    name="carbon_factor" 
                    required 
                    defaultValue={activeItem?.carbon_factor || ''}
                    placeholder="Contoh: 1.5"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-2 font-medium">Estimasi emisi karbon yang dapat dihindari per kg sampah.</p>
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
