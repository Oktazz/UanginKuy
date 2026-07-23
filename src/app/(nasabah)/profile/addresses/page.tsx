"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, MapPin, Plus, Loader2, Star, Search, Home, Briefcase, Building2, Tag } from "lucide-react";
import Link from "next/link";
import { LocationPicker } from "@/components/ui/LocationPicker";

const LABEL_PRESETS = [
  { label: "Rumah", icon: Home },
  { label: "Kantor", icon: Briefcase },
  { label: "Kos", icon: Building2 },
];

export default function AddressBookPage() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [label, setLabel] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [fullAddress, setFullAddress] = useState("");

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [isPrimary, setIsPrimary] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Geocoding Debounce
  const [geocodingTimer, setGeocodingTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchAddresses();
  }, []);

  useEffect(() => {
    if (!fullAddress || fullAddress.length < 5) return;
    if (geocodingTimer) clearTimeout(geocodingTimer);
    const timer = setTimeout(() => {
      handleManualGeocode(true);
    }, 1500);
    setGeocodingTimer(timer);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullAddress, district, city, province]);

  const handleManualGeocode = async (silent = false) => {
    if (!fullAddress || fullAddress.length < 5) return;
    setIsGeocoding(true);
    try {
      let query = `${fullAddress}, ${district}, ${city}, ${province}`;
      let res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      let data = await res.json();

      if (!data || data.length === 0) {
        query = `${district}, ${city}, ${province}`;
        res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
        data = await res.json();
      }

      if (!data || data.length === 0) {
        query = `${city}, ${province}`;
        res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
        data = await res.json();
      }

      if (data && data.length > 0) {
        setMapCenter({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
      } else if (!silent) {
        alert("Lokasi presisi tidak ditemukan, silakan geser peta secara manual.");
      }
    } catch (err) {
      console.error("Geocoding failed", err);
    } finally {
      setIsGeocoding(false);
    }
  };

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/addresses");
      const data = await res.json();
      if (data.success) {
        setAddresses(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label || !recipientName || !phoneNumber || !province || !city || !district || !fullAddress || !location) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          recipient_name: recipientName,
          phone_number: phoneNumber,
          province,
          city,
          district,
          full_address: fullAddress,
          latitude: location.lat,
          longitude: location.lng,
          is_primary: isPrimary || addresses.length === 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddForm(false);
        setLabel(""); setRecipientName(""); setPhoneNumber("");
        setProvince(""); setCity(""); setDistrict(""); setFullAddress("");
        setLocation(null); setMapCenter(null); setIsPrimary(false);
        fetchAddresses();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setLabel(""); setRecipientName(""); setPhoneNumber("");
    setProvince(""); setCity(""); setDistrict(""); setFullAddress("");
    setLocation(null); setMapCenter(null); setIsPrimary(false);
  };

  return (
    <div className="space-y-6 pb-4">
      {/* Page Header — konsisten dgn halaman lain */}
      <header className="flex items-center space-x-3">
        <Link
          href="/profile"
          className="w-9 h-9 bg-surface border border-gray-200 rounded-xl flex items-center justify-center shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 cursor-pointer flex-shrink-0"
          aria-label="Kembali ke profil"
        >
          <ArrowLeft size={18} className="text-gray-700" />
        </Link>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Buku Alamat</h2>
          <p className="text-sm text-gray-500 mt-1">Kelola lokasi penjemputan Anda.</p>
        </div>
      </header>

      <div>
        {!showAddForm ? (
          <div className="space-y-4">
            {/* Tambah Alamat Button */}
            <button
              id="btn-add-address"
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center space-x-2 bg-primary text-white font-bold py-3.5 px-4 rounded-2xl hover:bg-primary-dark active:scale-[0.98] transition-all duration-200 shadow-md shadow-primary/20 cursor-pointer"
            >
              <Plus size={18} />
              <span>Tambah Alamat Baru</span>
            </button>

            {/* Address List */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <Loader2 className="animate-spin text-primary" size={32} />
                <p className="text-sm text-gray-400">Memuat alamat...</p>
              </div>
            ) : addresses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="w-20 h-20 bg-white rounded-full border border-gray-100 shadow-sm flex items-center justify-center">
                  <MapPin size={36} className="text-gray-300" />
                </div>
                <div className="text-center">
                  <p className="text-gray-800 font-semibold text-base">Belum ada alamat</p>
                  <p className="text-gray-400 text-sm mt-1">Tambahkan alamat penjemputan pertama Anda</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden hover:border-primary/30 hover:shadow-[0_4px_16px_rgba(48,109,41,0.10)] transition-all duration-200"
                  >
                    {/* Card Top */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Tag size={14} className="text-primary" />
                          </div>
                          <span className="font-bold text-gray-900 text-sm">{address.label}</span>
                          {address.is_primary && (
                            <span className="inline-flex items-center space-x-1 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              <Star size={8} fill="currentColor" />
                              <span>Utama</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Recipient */}
                      <p className="text-sm font-semibold text-gray-800 mb-1">
                        {address.recipient_name}
                      </p>
                      <p className="text-xs text-gray-500 mb-2">{address.phone_number}</p>

                      {/* Address Detail */}
                      <div className="flex items-start space-x-1.5 mt-2">
                        <MapPin size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-700 leading-relaxed">{address.full_address}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {address.district}, {address.city}, {address.province}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Add Address Form */
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.06)] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Form Header */}
            <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-primary/5 to-transparent">
              <h2 className="text-base font-extrabold text-gray-900">Tambah Alamat Baru</h2>
              <p className="text-xs text-gray-500 mt-0.5">Isi detail alamat penjemputan</p>
            </div>

            <form onSubmit={handleAddAddress} className="p-5 space-y-6">
              {/* Section: Kontak */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-1 bg-primary rounded-full" />
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Informasi Penerima</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label htmlFor="recipient-name" className="block text-xs font-bold text-gray-500 mb-1.5">
                      Nama Lengkap <span className="text-error">*</span>
                    </label>
                    <input
                      id="recipient-name"
                      type="text"
                      required
                      placeholder="Nama penerima barang"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all duration-200"
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
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all duration-200"
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
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all duration-200"
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
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all duration-200"
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
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all duration-200"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="full-address" className="text-xs font-bold text-gray-500">
                        Alamat Lengkap & Patokan <span className="text-error">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleManualGeocode(false)}
                        disabled={isGeocoding || !fullAddress || fullAddress.length < 5}
                        className="inline-flex items-center space-x-1 text-[11px] font-bold bg-primary/10 text-primary hover:bg-primary/20 px-2.5 py-1 rounded-full transition-colors duration-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                      >
                        {isGeocoding
                          ? <Loader2 size={10} className="animate-spin" />
                          : <Search size={10} />
                        }
                        <span>Auto-Pin</span>
                      </button>
                    </div>
                    <textarea
                      id="full-address"
                      required
                      placeholder="Jalan, No. Rumah, Gedung, Patokan..."
                      value={fullAddress}
                      onChange={(e) => setFullAddress(e.target.value)}
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
                    onLocationSelect={(lat, lng) => setLocation({ lat, lng })}
                    centerCoordinates={mapCenter}
                  />
                </div>
                {!location && (
                  <p className="text-[11px] text-gray-400 flex items-center space-x-1">
                    <MapPin size={10} className="flex-shrink-0" />
                    <span>Geser peta untuk memilih titik lokasi tepat</span>
                  </p>
                )}
                {location && (
                  <p className="text-[11px] text-primary flex items-center space-x-1 font-semibold">
                    <MapPin size={10} className="flex-shrink-0" fill="currentColor" />
                    <span>Titik lokasi terpilih</span>
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
                      onClick={() => setLabel(preset)}
                      className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer ${
                        label === preset
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
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all duration-200"
                  />
                </div>
              </div>

              {/* Primary Checkbox */}
              {addresses.length > 0 && (
                <label
                  htmlFor="is-primary"
                  className="flex items-center space-x-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer hover:bg-white hover:border-primary/30 transition-all duration-200 group"
                >
                  <input
                    id="is-primary"
                    type="checkbox"
                    checked={isPrimary}
                    onChange={(e) => setIsPrimary(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
                      Jadikan Alamat Utama
                    </p>
                    <p className="text-xs text-gray-400">Akan digunakan sebagai default</p>
                  </div>
                </label>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-100 text-gray-600 font-bold py-3.5 rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all duration-200 text-sm cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || !location}
                  className="flex-1 bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary-dark active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm shadow-md shadow-primary/20 cursor-pointer"
                >
                  {submitting ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <MapPin size={16} fill="currentColor" />
                      <span>Simpan Alamat</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
