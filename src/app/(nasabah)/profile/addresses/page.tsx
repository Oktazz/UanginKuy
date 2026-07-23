"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, MapPin, Plus, Loader2, Star, Search } from "lucide-react";
import Link from "next/link";
import { LocationPicker } from "@/components/ui/LocationPicker";

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

  // Autocomplete Location via Nominatim
  useEffect(() => {
    if (!fullAddress || fullAddress.length < 5) return;
    if (geocodingTimer) clearTimeout(geocodingTimer);
    const timer = setTimeout(() => {
      handleManualGeocode(true);
    }, 1500); // 1.5s debounce
    setGeocodingTimer(timer);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullAddress, district, city, province]);

  const handleManualGeocode = async (silent = false) => {
    if (!fullAddress || fullAddress.length < 5) return;
    setIsGeocoding(true);
    try {
      // 1. Try full address
      let query = `${fullAddress}, ${district}, ${city}, ${province}`;
      let res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      let data = await res.json();

      // 2. Try without fullAddress (district level)
      if (!data || data.length === 0) {
        query = `${district}, ${city}, ${province}`;
        res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
        data = await res.json();
      }

      // 3. Try without district (city level)
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
        // Reset form
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

  return (
    <div className="max-w-xl mx-auto pb-20 px-4 sm:px-0">
      <header className="mb-6 flex items-center mt-4 sm:mt-0">
        <Link href="/profile" className="mr-4 p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors">
          <ArrowLeft size={20} className="text-gray-700" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Buku Alamat</h2>
          <p className="text-sm text-gray-500">Kelola lokasi penjemputan Anda</p>
        </div>
      </header>

      {!showAddForm ? (
        <div className="space-y-6">
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center space-x-2 bg-primary/10 text-primary border border-primary/20 font-bold p-4 rounded-2xl hover:bg-primary/20 transition-all duration-300 group"
          >
            <Plus size={20} className="group-hover:scale-110 transition-transform" />
            <span>Tambah Alamat Baru</span>
          </button>

          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : addresses.length === 0 ? (
            <div className="text-center p-8 bg-surface rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <MapPin size={32} />
              </div>
              <p className="text-gray-500 font-medium">Anda belum menyimpan alamat satupun.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {addresses.map((address) => (
                <div key={address.id} className="bg-surface rounded-2xl p-5 border border-gray-100 shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-300">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-gray-900">{address.label}</span>
                      {address.is_primary && (
                        <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center uppercase tracking-wider">
                          <Star size={10} className="mr-1" /> Utama
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-800 font-bold mb-1">{address.recipient_name} | {address.phone_number}</div>
                  <p className="text-sm text-gray-600 leading-relaxed">{address.full_address}</p>
                  <p className="text-xs text-gray-500 mt-1">{address.district}, {address.city}, {address.province}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-surface rounded-3xl p-6 border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-4">
          <h3 className="text-lg font-bold mb-4">Alamat Baru</h3>
          
          <form onSubmit={handleAddAddress} className="space-y-5">
            {/* Kontak */}
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-gray-900 border-b pb-2">Kontak</h4>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nama</label>
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nomor Telepon</label>
                <input
                  type="tel"
                  required
                  placeholder="Contoh: 081234567890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Alamat */}
            <div className="space-y-4 pt-2">
              <h4 className="font-bold text-sm text-gray-900 border-b pb-2">Alamat</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Provinsi</label>
                  <input
                    type="text"
                    required
                    placeholder="Provinsi"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Kota/Kabupaten</label>
                  <input
                    type="text"
                    required
                    placeholder="Kota/Kabupaten"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Kecamatan</label>
                <input
                  type="text"
                  required
                  placeholder="Kecamatan"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Alamat Lengkap & Patokan</span>
                  <button 
                    type="button" 
                    onClick={() => handleManualGeocode(false)}
                    disabled={isGeocoding || !fullAddress}
                    className="text-[10px] bg-primary/10 text-primary hover:bg-primary/20 hover:scale-105 transition-all px-2 py-0.5 rounded-full flex items-center disabled:opacity-50"
                  >
                    {isGeocoding ? <Loader2 size={10} className="mr-1 animate-spin"/> : <Search size={10} className="mr-1"/>} 
                    Auto-Pin Peta
                  </button>
                </label>
                <textarea
                  required
                  placeholder="Nama Jalan, Gedung, No. Rumah, Patokan..."
                  value={fullAddress}
                  onChange={(e) => setFullAddress(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none h-20"
                />
              </div>
            </div>

            {/* Peta */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Koreksi Titik Lokasi Peta</label>
              <LocationPicker 
                onLocationSelect={(lat, lng) => setLocation({ lat, lng })} 
                centerCoordinates={mapCenter}
              />
            </div>

            {/* Label */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tandai Sebagai (Label)</label>
              <div className="flex space-x-2 mb-3">
                {['Rumah', 'Kantor', 'Kos'].map(preset => (
                  <button 
                    type="button"
                    key={preset}
                    onClick={() => setLabel(preset)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${label === preset ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50'}`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <input
                type="text"
                required
                placeholder="Atau ketik sendiri (Contoh: Rumah Bude)"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            {addresses.length > 0 && (
              <label className="flex items-center space-x-3 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700">Atur sebagai Alamat Utama</span>
              </label>
            )}

            <div className="flex space-x-3 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 bg-gray-100 text-gray-600 font-bold p-4 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting || !location}
                className="flex-1 bg-primary text-white font-bold p-4 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 flex justify-center items-center"
              >
                {submitting ? <Loader2 className="animate-spin" size={20} /> : "Simpan Alamat"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
