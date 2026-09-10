import { Building2, Briefcase, Home, MapPin, Save, Search, X } from "lucide-react";
import { LocationPicker } from "@/components/ui/LocationPicker";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Button } from "@/components/ui/button";
import type { AddressFormState } from "./types";

const LABEL_PRESETS = [
  { label: "Rumah", icon: Home },
  { label: "Kantor", icon: Briefcase },
  { label: "Kos", icon: Building2 },
];

interface AddressFormProps {
  mode: "add" | "edit";
  form: AddressFormState;
  hasAddresses: boolean;
  isSubmitting: boolean;
  isGeocoding: boolean;
  mapError: string | null;
  onChange: (patch: Partial<AddressFormState>) => void;
  onAutoPin: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const inputClassName =
  "w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all duration-200";

export function AddressForm({
  mode,
  form,
  hasAddresses,
  isSubmitting,
  isGeocoding,
  mapError,
  onChange,
  onAutoPin,
  onSubmit,
  onCancel,
}: AddressFormProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.06)] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Form Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-primary/5 to-transparent flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-gray-900">
            {mode === "edit" ? "Ubah Alamat" : "Tambah Alamat Baru"}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {mode === "edit"
              ? `Perbarui informasi detail lokasi ${form.label ? `(${form.label})` : ""}`
              : "Isi detail alamat penjemputan"}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Tutup form"
        >
          <X size={16} />
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-6 p-5 md:p-8">
        {/* Section: Kontak */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="h-4 w-1 bg-primary rounded-full" />
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Informasi Penerima</h3>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="recipient-name" className="block text-xs font-bold text-gray-500 mb-1.5">
                Nama Lengkap <span className="text-error">*</span>
              </label>
              <input
                id="recipient-name"
                type="text"
                required
                placeholder="Nama penerima barang"
                value={form.recipientName}
                onChange={(e) => onChange({ recipientName: e.target.value })}
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="phone-number" className="block text-xs font-bold text-gray-500 mb-1.5">
                Nomor Telepon <span className="text-error">*</span>
              </label>
              <input
                id="phone-number"
                type="tel"
                required
                placeholder="08xxxxxxxxxx"
                value={form.phoneNumber}
                onChange={(e) => onChange({ phoneNumber: e.target.value })}
                className={inputClassName}
              />
            </div>
          </div>
        </div>

        {/* Section: Alamat */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="h-4 w-1 bg-primary rounded-full" />
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Lokasi</h3>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="province" className="block text-xs font-bold text-gray-500 mb-1.5">
                  Provinsi <span className="text-error">*</span>
                </label>
                <input
                  id="province"
                  type="text"
                  required
                  placeholder="Provinsi"
                  value={form.province}
                  onChange={(e) => onChange({ province: e.target.value })}
                  className={inputClassName}
                />
              </div>
              <div>
                <label htmlFor="city" className="block text-xs font-bold text-gray-500 mb-1.5">
                  Kota/Kabupaten <span className="text-error">*</span>
                </label>
                <input
                  id="city"
                  type="text"
                  required
                  placeholder="Kota"
                  value={form.city}
                  onChange={(e) => onChange({ city: e.target.value })}
                  className={inputClassName}
                />
              </div>
            </div>

            <div>
              <label htmlFor="district" className="block text-xs font-bold text-gray-500 mb-1.5">
                Kecamatan <span className="text-error">*</span>
              </label>
              <input
                id="district"
                type="text"
                required
                placeholder="Kecamatan"
                value={form.district}
                onChange={(e) => onChange({ district: e.target.value })}
                className={inputClassName}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="full-address" className="text-xs font-bold text-gray-500">
                  Alamat Lengkap & Patokan <span className="text-error">*</span>
                </label>
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={onAutoPin}
                  disabled={!form.fullAddress || form.fullAddress.length < 5}
                  loading={isGeocoding}
                  loadingLabel="Auto-Pin"
                  className="items-center rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Search size={10} />
                  <span>Auto-Pin</span>
                </Button>
              </div>
              <textarea
                id="full-address"
                required
                placeholder="Jalan, No. Rumah, Gedung, Patokan..."
                value={form.fullAddress}
                onChange={(e) => onChange({ fullAddress: e.target.value })}
                rows={3}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all duration-200 resize-none leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Section: Peta */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="h-4 w-1 bg-primary rounded-full" />
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Koreksi Titik di Peta</h3>
          </div>
          <div className="rounded-xl overflow-hidden border border-gray-200">
            <LocationPicker
              onLocationSelect={(lat, lng) => onChange({ location: { lat, lng } })}
              centerCoordinates={form.mapCenter}
            />
          </div>
          <ErrorAlert message={mapError} />
          {!form.location && (
            <p className="text-[11px] text-gray-400 flex items-center space-x-1">
              <MapPin size={10} className="flex-shrink-0" />
              <span>Geser peta untuk memilih titik lokasi tepat</span>
            </p>
          )}
          {form.location && (
            <p className="text-[11px] text-primary flex items-center space-x-1 font-semibold">
              <MapPin size={10} className="flex-shrink-0" fill="currentColor" />
              <span>Titik lokasi terpilih: ({form.location.lat.toFixed(6)}, {form.location.lng.toFixed(6)})</span>
            </p>
          )}
        </div>

        {/* Section: Label */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="h-4 w-1 bg-primary rounded-full" />
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Label Alamat</h3>
          </div>

          {/* Preset Buttons */}
          <div className="flex space-x-2">
            {LABEL_PRESETS.map(({ label: preset, icon: Icon }) => (
              <button
                type="button"
                key={preset}
                onClick={() => onChange({ label: preset })}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer ${
                  form.label === preset
                    ? "bg-primary text-white border-primary shadow-sm shadow-primary/20"
                    : "bg-white text-gray-600 border-gray-200 hover:border-primary/40 hover:text-primary"
                }`}
              >
                <Icon size={13} />
                <span>{preset}</span>
              </button>
            ))}
          </div>

          <div>
            <label htmlFor="label-input" className="block text-xs font-bold text-gray-500 mb-1.5">
              Atau tulis sendiri <span className="text-error">*</span>
            </label>
            <input
              id="label-input"
              type="text"
              required
              placeholder="Contoh: Rumah Bude, Gudang, dll."
              value={form.label}
              onChange={(e) => onChange({ label: e.target.value })}
              className={inputClassName}
            />
          </div>
        </div>

        {/* Primary Checkbox */}
        {hasAddresses && (
          <label
            htmlFor="is-primary"
            className="flex items-center space-x-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer hover:bg-white hover:border-primary/30 transition-all duration-200 group"
          >
            <input
              id="is-primary"
              type="checkbox"
              checked={form.isPrimary}
              onChange={(e) => onChange({ isPrimary: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
            />
            <div>
              <p className="text-sm font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
                Jadikan Alamat Utama
              </p>
              <p className="text-xs text-gray-400">Akan digunakan sebagai lokasi penjemputan default</p>
            </div>
          </label>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="shrink-0 rounded-xl bg-gray-100 px-5 py-3.5 font-bold text-gray-600 hover:bg-gray-200 active:scale-[0.98] sm:px-6"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={!form.location}
            loading={isSubmitting}
            loadingLabel={mode === "edit" ? "Simpan Perubahan" : "Simpan Alamat"}
            className="min-w-0 flex-1 rounded-xl bg-primary px-4 py-3.5 font-bold text-white shadow-md shadow-primary/20 hover:bg-primary-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:px-6"
          >
            {mode === "edit" ? (
              <Save size={16} className="shrink-0" />
            ) : (
              <MapPin size={16} fill="currentColor" className="shrink-0" />
            )}
            <span>{mode === "edit" ? "Simpan Perubahan" : "Simpan Alamat"}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}