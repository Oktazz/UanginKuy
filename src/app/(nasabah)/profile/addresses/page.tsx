"use client";

import { useState, useEffect } from "react";
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Navigation2,
  Home,
  Briefcase,
  Building2,
  Star,
  Map,
  X,
  Save,
  ArrowLeft,
  AlertTriangle,
  Search,
  Tag
} from "lucide-react";
import Link from "next/link";
import { LocationPicker } from "@/components/ui/LocationPicker";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { useToast } from "@/components/ui/ToastProvider";

const LABEL_PRESETS = [
  { label: "Rumah", icon: Home },
  { label: "Kantor", icon: Briefcase },
  { label: "Kos", icon: Building2 },
];

export default function AddressBookPage() {
  const toast = useToast();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formMode, setFormMode] = useState<"none" | "add" | "edit">("none");
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Action states
  const [deletingAddress, setDeletingAddress] = useState<any | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

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
  const [mapError, setMapError] = useState<string | null>(null);

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
      let res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );
      let data = await res.json();

      if (!data || data.length === 0) {
        query = `${district}, ${city}, ${province}`;
        res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
        );
        data = await res.json();
      }

      if (!data || data.length === 0) {
        query = `${city}, ${province}`;
        res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
        );
        data = await res.json();
      }

      if (data && data.length > 0) {
        const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        setMapCenter(coords);
        setLocation(coords);
        setMapError(null);
      } else if (!silent) {
        setMapError("Lokasi presisi tidak ditemukan, silakan geser peta secara manual.");
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

  const handleStartAdd = () => {
    resetForm();
    setFormMode("add");
    setEditingAddressId(null);
    setIsPrimary(addresses.length === 0);
  };

  const handleStartEdit = (address: any) => {
    setFormMode("edit");
    setEditingAddressId(address.id);
    setLabel(address.label || "");
    setRecipientName(address.recipient_name || "");
    setPhoneNumber(address.phone_number || "");
    setProvince(address.province || "");
    setCity(address.city || "");
    setDistrict(address.district || "");
    setFullAddress(address.full_address || "");

    if (address.latitude != null && address.longitude != null) {
      const coords = { lat: Number(address.latitude), lng: Number(address.longitude) };
      setLocation(coords);
      setMapCenter(coords);
    } else {
      setLocation(null);
      setMapCenter(null);
    }

    setIsPrimary(!!address.is_primary);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label || !recipientName || !phoneNumber || !province || !city || !district || !fullAddress || !location)
      return;

    setSubmitting(true);
    try {
      const url = formMode === "edit" ? `/api/addresses/${editingAddressId}` : "/api/addresses";
      const method = formMode === "edit" ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
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
          is_primary: isPrimary || (formMode === "add" && addresses.length === 0),
        }),
      });

      const data = await res.json();
      if (data.success) {
        resetForm();
        toast({
          type: "success",
          message:
            formMode === "edit"
              ? "Alamat berhasil diperbarui."
              : "Alamat baru berhasil ditambahkan.",
        });
        fetchAddresses();
      } else {
        toast({
          type: "error",
          message: data.message || data.error || "Gagal menyimpan alamat.",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        type: "error",
        message: "Terjadi kesalahan saat menyimpan alamat.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetPrimary = (addressId: string) => {
    const prev = addresses;
    // Optimistic: langsung update is_primary di state lokal
    setAddresses((cur) =>
      cur.map((a) => ({ ...a, is_primary: a.id === addressId }))
    );

    // API di background
    fetch(`/api/addresses/${addressId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_primary: true }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          toast({ type: "success", message: "Alamat utama berhasil diperbarui." });
        } else {
          setAddresses(prev);
          toast({
            type: "error",
            message: data.message || data.error || "Gagal memperbarui alamat utama.",
          });
        }
      })
      .catch((err) => {
        console.error(err);
        setAddresses(prev);
        toast({ type: "error", message: "Koneksi gagal. Alamat dikembalikan." });
      });
  };

  const handleDeleteAddress = (address: any) => {
    const prev = addresses;
    setDeletingAddress(null); // Tutup modal instan
    setRemovingId(address.id); // Mulai animasi fade-out
    
    // Hapus dari state setelah animasi CSS selesai
    setTimeout(() => {
      setAddresses((cur) => cur.filter((a) => a.id !== address.id));
      setRemovingId(null);
    }, 300);

    fetch(`/api/addresses/${address.id}`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          toast({ type: "success", message: "Alamat berhasil dihapus." });
        } else {
          setAddresses(prev);
          setRemovingId(null);
          toast({ type: "error", message: data.message || data.error || "Gagal menghapus alamat." });
        }
      })
      .catch((err) => {
        console.error(err);
        setAddresses(prev);
        setRemovingId(null);
        toast({ type: "error", message: "Koneksi gagal. Alamat dikembalikan." });
      });
  };

  const resetForm = () => {
    setFormMode("none");
    setEditingAddressId(null);
    setLabel("");
    setRecipientName("");
    setPhoneNumber("");
    setProvince("");
    setCity("");
    setDistrict("");
    setFullAddress("");
    setLocation(null);
    setMapCenter(null);
    setIsPrimary(false);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-4">
      {/* Page Header */}
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

      {/* Feedback Banner */}


      <div>
        {formMode === "none" ? (
          <div className="space-y-4">
            {/* Tambah Alamat Button */}
            <button
              id="btn-add-address"
              onClick={handleStartAdd}
              className="w-full flex items-center justify-center space-x-2 bg-primary text-white font-bold py-3.5 px-4 rounded-2xl hover:bg-primary-dark active:scale-[0.98] transition-all duration-200 shadow-md shadow-primary/20 cursor-pointer"
            >
              <Plus size={18} />
              <span>Tambah Alamat Baru</span>
            </button>

            {/* Address List */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col justify-between h-48 animate-pulse">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-lg flex-shrink-0" />
                        <div className="h-4 bg-gray-200 rounded w-24" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32" />
                        <div className="h-3 bg-gray-200 rounded w-24" />
                      </div>
                      <div className="space-y-1">
                        <div className="h-3 bg-gray-200 rounded w-full" />
                        <div className="h-3 bg-gray-200 rounded w-4/5" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-4">
                      <div className="h-4 bg-gray-200 rounded w-24" />
                      <div className="flex items-center space-x-2">
                        <div className="h-6 bg-gray-200 rounded w-12" />
                        <div className="h-6 bg-gray-200 rounded w-16" />
                      </div>
                    </div>
                  </div>
                ))}
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
              <div className="grid gap-3 md:grid-cols-2">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className={`bg-white rounded-2xl border border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden hover:border-primary/30 hover:shadow-[0_4px_16px_rgba(48,109,41,0.10)] transition-all duration-200 flex flex-col justify-between ${
                      removingId === address.id ? "item-exiting" : ""
                    }`}
                  >
                    {/* Card Content */}
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
                      <p className="text-sm font-semibold text-gray-800 mb-0.5">
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

                    {/* Card Actions Footer */}
                    <div className="px-4 py-2.5 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-2 text-xs">
                      <div>
                        {!address.is_primary ? (
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(address.id)}
                            className="inline-flex items-center space-x-1 text-primary hover:text-primary-dark font-semibold transition-colors cursor-pointer"
                          >
                            <Star size={13} />
                            <span>Jadikan Utama</span>
                          </button>
                        ) : (
                          <span className="text-gray-400 inline-flex items-center space-x-1 font-medium">
                            <Star size={13} className="text-amber-500 fill-amber-500" />
                            <span className="text-gray-600">Alamat Utama</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(address)}
                          className="inline-flex items-center space-x-1 text-gray-600 hover:text-primary px-2.5 py-1.5 rounded-lg hover:bg-primary/5 transition-colors font-semibold cursor-pointer"
                        >
                          <Pencil size={13} />
                          <span>Ubah</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingAddress(address)}
                          className="inline-flex items-center space-x-1 text-gray-400 hover:text-error px-2.5 py-1.5 rounded-lg hover:bg-error/5 transition-colors font-semibold cursor-pointer"
                        >
                          <Trash2 size={13} />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Address Form (Add or Edit) */
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.06)] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Form Header */}
            <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-primary/5 to-transparent flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-gray-900">
                  {formMode === "edit" ? "Ubah Alamat" : "Tambah Alamat Baru"}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formMode === "edit"
                    ? `Perbarui informasi detail lokasi ${label ? `(${label})` : ""}`
                    : "Isi detail alamat penjemputan"}
                </p>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Tutup form"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6 p-5 md:p-8">
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
                        {isGeocoding ? (
                          <Loader2 size={10} className="animate-spin" />
                        ) : (
                          <Search size={10} />
                        )}
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
                <ErrorAlert message={mapError} />
                {!location && (
                  <p className="text-[11px] text-gray-400 flex items-center space-x-1">
                    <MapPin size={10} className="flex-shrink-0" />
                    <span>Geser peta untuk memilih titik lokasi tepat</span>
                  </p>
                )}
                {location && (
                  <p className="text-[11px] text-primary flex items-center space-x-1 font-semibold">
                    <MapPin size={10} className="flex-shrink-0" fill="currentColor" />
                    <span>Titik lokasi terpilih: ({location.lat.toFixed(6)}, {location.lng.toFixed(6)})</span>
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
                    <p className="text-xs text-gray-400">Akan digunakan sebagai lokasi penjemputan default</p>
                  </div>
                </label>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 sm:px-6 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all duration-200 text-sm cursor-pointer shrink-0"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || !location}
                  className="flex-1 min-w-0 bg-primary text-white font-bold py-3.5 px-4 sm:px-6 rounded-xl hover:bg-primary-dark active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-md shadow-primary/20 cursor-pointer whitespace-nowrap"
                >
                  {submitting ? (
                    <Loader2 className="animate-spin shrink-0" size={18} />
                  ) : (
                    <>
                      {formMode === "edit" ? (
                        <Save size={16} className="shrink-0" />
                      ) : (
                        <MapPin size={16} fill="currentColor" className="shrink-0" />
                      )}
                      <span>{formMode === "edit" ? "Simpan Perubahan" : "Simpan Alamat"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-error/10 text-error flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">Hapus Alamat</h3>
                <p className="text-xs text-gray-500 mt-0.5">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
              <button
                type="button"
                onClick={() => setDeletingAddress(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-1.5 text-xs text-gray-600">
              <div className="flex items-center space-x-2">
                <Tag size={13} className="text-primary" />
                <span className="font-bold text-gray-900">{deletingAddress.label}</span>
                {deletingAddress.is_primary && (
                  <span className="bg-primary/10 text-primary font-bold text-[10px] px-2 py-0.5 rounded-full">
                    Utama
                  </span>
                )}
              </div>
              <p className="font-medium text-gray-800">{deletingAddress.recipient_name} ({deletingAddress.phone_number})</p>
              <p className="text-gray-500 leading-relaxed">{deletingAddress.full_address}</p>
            </div>

            {deletingAddress.is_primary && addresses.length > 1 && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-xl leading-relaxed">
                <strong>Catatan:</strong> Alamat ini adalah alamat utama Anda. Setelah dihapus, salah satu alamat Anda yang lain akan otomatis dijadikan alamat utama.
              </p>
            )}

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingAddress(null)}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteAddress(deletingAddress)}
                className="flex-1 bg-error text-white font-bold py-3 rounded-xl hover:bg-red-700 active:scale-[0.98] transition-all text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-error/20 cursor-pointer"
              >
                <Trash2 size={15} />
                <span>Ya, Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
