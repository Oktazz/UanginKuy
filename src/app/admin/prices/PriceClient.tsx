"use client";

import { useState } from "react";
import { Edit2, Trash2, Plus, X, Filter } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { CustomAlertDialog } from "@/components/ui/ConfirmDialog";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { addCategory, updateCategory, deleteCategory } from "./actions";
import type { Database } from "@/types/supabase";

type WasteCategory = Database["public"]["Tables"]["waste_categories"]["Row"];

const materialGroupLabels: Record<string, string> = {
  plastic: "Plastik",
  paper: "Kertas",
  metal: "Logam",
  glass: "Kaca",
};

const materialGroupOptions = Object.entries(materialGroupLabels).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

const materialGroupFilterOptions = [
  { value: "all", label: "Semua Jenis" },
  ...materialGroupOptions,
];

export default function PriceClient({
  categories,
}: {
  categories: WasteCategory[];
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeItem, setActiveItem] = useState<WasteCategory | null>(null);
  const [formMaterialGroup, setFormMaterialGroup] = useState("");
  const [materialGroupError, setMaterialGroupError] = useState(false);
  const [selectedMaterialGroup, setSelectedMaterialGroup] = useState("all");
  const [categoryToDelete, setCategoryToDelete] =
    useState<WasteCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredCategories =
    selectedMaterialGroup === "all"
      ? categories
      : categories.filter(
          (category) => category.material_group === selectedMaterialGroup,
        );

  const openAddModal = () => {
    setIsEditMode(false);
    setActiveItem(null);
    setFormMaterialGroup("");
    setMaterialGroupError(false);
    setIsModalOpen(true);
  };

  const openEditModal = (item: WasteCategory) => {
    setIsEditMode(true);
    setActiveItem(item);
    setFormMaterialGroup(item.material_group);
    setMaterialGroupError(false);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    setIsDeleting(true);
    const formData = new FormData();
    formData.set("id", String(categoryToDelete.id));

    try {
      await deleteCategory(formData);
      setCategoryToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Manajemen Harga
          </h2>
          <p className="text-gray-500 mt-2 font-medium">
            Atur kategori sampah, harga per kg, dan faktor emisi karbon.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center space-x-2 bg-primary text-white px-5 py-3 rounded-xl font-bold hover:bg-primary-dark transition-all shadow-sm"
        >
          <Plus size={20} />
          <span>Tambah Kategori</span>
        </button>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-surface shadow-sm">
        <div className="relative z-20 flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
            <Filter size={18} className="text-primary" />
            <span>Filter Harga Sampah</span>
          </div>
          <div className="grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:flex sm:w-auto">
            <label
              htmlFor="material-group-filter"
              className="shrink-0 text-sm font-medium text-gray-500"
            >
              Jenis
            </label>
            <CustomSelect
              id="material-group-filter"
              options={materialGroupFilterOptions}
              value={selectedMaterialGroup}
              onChange={setSelectedMaterialGroup}
              className="min-w-0 sm:w-56 sm:min-w-56"
              triggerClassName="rounded-xl text-sm font-semibold"
            />
          </div>
        </div>
        <div className="overflow-x-auto rounded-b-3xl">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 font-bold text-gray-500 text-sm uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-4 font-bold text-gray-500 text-sm uppercase tracking-wider">
                  Jenis
                </th>
                <th className="px-6 py-4 font-bold text-gray-500 text-sm uppercase tracking-wider">
                  Harga / Kg
                </th>
                <th className="px-6 py-4 font-bold text-gray-500 text-sm uppercase tracking-wider">
                  Faktor Karbon
                </th>
                <th className="px-6 py-4 font-bold text-gray-500 text-sm uppercase tracking-wider text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCategories.map((cat) => (
                <tr
                  key={cat.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-5 font-bold text-gray-900">
                    {cat.name}
                  </td>
                  <td className="px-6 py-5 font-medium text-gray-500">
                    {materialGroupLabels[cat.material_group] ??
                      cat.material_group}
                  </td>
                  <td className="px-6 py-5 font-medium text-gray-900">
                    Rp {cat.price_per_kg.toLocaleString("id-ID")}
                  </td>
                  <td className="px-6 py-5 font-medium text-gray-500">
                    {cat.carbon_factor} kg CO2e
                  </td>
                  <td className="px-6 py-5 flex justify-end space-x-3">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Hapus kategori ${cat.name}`}
                      onClick={() => setCategoryToDelete(cat)}
                      className="p-2 text-gray-400 hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCategories.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    {categories.length === 0
                      ? "Belum ada data kategori sampah."
                      : "Tidak ada kategori untuk jenis sampah yang dipilih."}
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
                {isEditMode ? "Edit Kategori" : "Tambah Kategori Baru"}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form
              action={isEditMode ? updateCategory : addCategory}
              onSubmit={(event) => {
                if (!formMaterialGroup) {
                  event.preventDefault();
                  setMaterialGroupError(true);
                  return;
                }
                setTimeout(closeModal, 100);
              }}
            >
              {isEditMode && (
                <input type="hidden" name="id" value={activeItem?.id} />
              )}
              <input
                type="hidden"
                name="material_group"
                value={formMaterialGroup}
              />
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Nama Kategori
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={activeItem?.name || ""}
                    placeholder="Contoh: Plastik PET"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label
                    htmlFor="category-material-group"
                    className="block text-sm font-bold text-gray-700 mb-2"
                  >
                    Jenis Sampah
                  </label>
                  <CustomSelect
                    id="category-material-group"
                    options={materialGroupOptions}
                    value={formMaterialGroup}
                    onChange={(value) => {
                      setFormMaterialGroup(value);
                      setMaterialGroupError(false);
                    }}
                    placeholder="Pilih jenis sampah..."
                    triggerClassName={
                      materialGroupError
                        ? "rounded-xl border-error ring-2 ring-error/20"
                        : "rounded-xl"
                    }
                  />
                  {materialGroupError && (
                    <ErrorAlert
                      message="Jenis sampah wajib dipilih."
                      className="mt-2 px-3 py-2 text-xs"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Harga per Kg (Rp)
                  </label>
                  <input
                    type="number"
                    name="price_per_kg"
                    required
                    defaultValue={activeItem?.price_per_kg || ""}
                    placeholder="Contoh: 2500"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Faktor Karbon (kg CO2e)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="carbon_factor"
                    required
                    defaultValue={activeItem?.carbon_factor || ""}
                    placeholder="Contoh: 1.5"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-2 font-medium">
                    Estimasi emisi karbon yang dapat dihindari per kg sampah.
                  </p>
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
        open={categoryToDelete !== null}
        title="Hapus kategori sampah?"
        description={`Kategori “${categoryToDelete?.name ?? ""}” akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.`}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setCategoryToDelete(null)}
      />
    </div>
  );
}
