"use client";

import { useState, useEffect } from "react";
import { Upload, Calendar, MapPin, CheckCircle2, Loader2, Sparkles, ArrowRight, SkipForward, Search } from "lucide-react";
import { LocationPicker } from "@/components/ui/LocationPicker";
import { useRouter } from "next/navigation";

export default function BookingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<number | null>(null);
  
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [saveNewAddressToBook, setSaveNewAddressToBook] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState("");
  
  const [recipientName, setRecipientName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");

  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [addressDetail, setAddressDetail] = useState("");
  
  const [file, setFile] = useState<File | null>(null);
  const [estimation, setEstimation] = useState<{ category: string, price: number } | null>(null);

  const [geocodingTimer, setGeocodingTimer] = useState<NodeJS.Timeout | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Autocomplete Location via Nominatim for new addresses
  useEffect(() => {
    if (!isAddingNewAddress || !addressDetail || addressDetail.length < 5) return;
    if (geocodingTimer) clearTimeout(geocodingTimer);
    const timer = setTimeout(() => {
      handleManualGeocode(true);
    }, 1500);
    setGeocodingTimer(timer);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressDetail, district, city, province, isAddingNewAddress]);

  const handleManualGeocode = async (silent = false) => {
    if (!addressDetail || addressDetail.length < 5) return;
    setIsGeocoding(true);
    try {
      let query = `${addressDetail}, ${district}, ${city}, ${province}`;
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

  // Fetch Schedules & Addresses on Mount
  useEffect(() => {
    fetch('/api/schedules/active')
      .then(res => res.json())
      .then(data => {
        if (data.success) setSchedules(data.data);
      });
      
    fetch('/api/addresses')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          setAddresses(data.data);
          setSelectedAddressId(data.data[0].id); // Default to primary/first
        } else {
          setIsAddingNewAddress(true); // Force new address if none exists
        }
      });
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setEstimation(null); // Reset estimation on new file
    }
  };

  const analyzeImage = async () => {
    if (!file) return;
    setLoading(true);
    
    // Convert to base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      try {
        const response = await fetch('/api/ai/estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: reader.result })
        });
        const data = await response.json();
        if (data.success) {
          setEstimation(data.data);
        }
      } catch (err) {
        console.error("AI Error", err);
      } finally {
        setLoading(false);
      }
    };
  };

  const submitBooking = async () => {
    if (!selectedSchedule) return;
    if (isAddingNewAddress && !location) return;
    if (!isAddingNewAddress && !selectedAddressId) return;

    setLoading(true);
    try {
      let finalAddressId = selectedAddressId;

      // If user wants to save the new address to address book
      if (isAddingNewAddress && saveNewAddressToBook && location) {
        const addressRes = await fetch('/api/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            label: newAddressLabel || "Alamat Baru",
            recipient_name: recipientName || "Pengguna",
            phone_number: phoneNumber || "-",
            province: province || "-",
            city: city || "-",
            district: district || "-",
            full_address: addressDetail || "Alamat Baru",
            latitude: location.lat,
            longitude: location.lng,
            is_primary: addresses.length === 0, // Set primary if it's the first
          })
        });
        const addressData = await addressRes.json();
        if (addressData.success) {
          finalAddressId = addressData.data.id;
        }
      }

      const ticketPayload: any = {
        schedule_id: selectedSchedule,
        ai_image_url: 'https://example.com/mock_image.jpg', // In real app, upload to Supabase Storage first
        ai_predicted_category: estimation?.category,
        ai_estimated_price: estimation?.price,
      };

      if (isAddingNewAddress) {
        if (saveNewAddressToBook && finalAddressId) {
          ticketPayload.address_id = finalAddressId;
        } else {
          ticketPayload.pickup_address = addressDetail;
          ticketPayload.latitude = location?.lat;
          ticketPayload.longitude = location?.lng;
        }
      } else {
        ticketPayload.address_id = finalAddressId;
      }

      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketPayload)
      });
      const data = await response.json();
      if (data.success) {
        router.push(`/tickets/${data.data.id}`);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto pb-8">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Buat Jadwal Jemput</h2>
        <p className="text-sm text-gray-500">Tukar sampah Anda menjadi uang dengan mudah.</p>
      </header>

      {/* Stepper Indicator */}
      <div className="flex items-start justify-center mb-12">
        
        {/* Step 1 */}
        <div className="relative flex flex-col items-center z-10">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${step >= 1 ? 'bg-primary text-surface shadow-md' : 'bg-gray-200 text-gray-500'}`}>
            {step > 1 ? <CheckCircle2 size={20} /> : 1}
          </div>
          <span className={`absolute top-12 text-xs font-medium text-center whitespace-nowrap transition-colors duration-300 ${step >= 1 ? 'text-primary' : 'text-gray-400'}`}>
            Detail Penjemputan
          </span>
        </div>

        {/* Dashed Line */}
        <div className="w-24 sm:w-32 h-0 border-t-[3px] border-dashed border-gray-200 mt-5 relative z-0">
          <div 
            className="absolute -top-[3px] left-0 h-0 border-t-[3px] border-dashed border-primary transition-all duration-500 ease-out" 
            style={{ width: step > 1 ? '100%' : '0%' }}
          ></div>
        </div>

        {/* Step 2 */}
        <div className="relative flex flex-col items-center z-10">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${step >= 2 ? 'bg-primary text-surface shadow-md' : 'bg-gray-200 text-gray-500'}`}>
            {step > 2 ? <CheckCircle2 size={20} /> : 2}
          </div>
          <span className={`absolute top-12 text-xs font-medium text-center whitespace-nowrap transition-colors duration-300 ${step >= 2 ? 'text-primary' : 'text-gray-400'}`}>
            Estimasi Harga
          </span>
        </div>

      </div>

      <div className="bg-surface rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 relative overflow-hidden">
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <h3 className="text-lg font-bold flex items-center mb-4">
                <Calendar size={20} className="text-primary mr-2" /> Pilih Tanggal Jemput
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {schedules.map((schedule) => (
                  <button
                    key={schedule.id}
                    onClick={() => setSelectedSchedule(schedule.id)}
                    className={`p-4 rounded-2xl border-2 text-center transition-all duration-200 ${selectedSchedule === schedule.id ? 'border-primary bg-primary/10 text-primary shadow-sm transform scale-[1.02]' : 'border-gray-200 hover:border-primary/40 text-gray-700 hover:bg-gray-50'}`}
                  >
                    <span className="block text-sm font-bold">
                      {new Date(schedule.operational_date).toLocaleDateString('id-ID', { weekday: 'long' })}
                    </span>
                    <span className="block text-xs mt-1 opacity-80">
                      {new Date(schedule.operational_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  </button>
                ))}
                {schedules.length === 0 && (
                  <div className="col-span-2 text-center text-sm text-gray-500 py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    Belum ada jadwal buka dari Pengepul.
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold flex items-center mb-4">
                <MapPin size={20} className="text-primary mr-2" /> Konfirmasi Lokasi
              </h3>

              {addresses.length > 0 && (
                <div className="mb-4 flex space-x-2 bg-gray-100 p-1 rounded-xl">
                  <button 
                    onClick={() => setIsAddingNewAddress(false)}
                    className={`flex-1 text-sm font-bold py-2 px-4 rounded-lg transition-all ${!isAddingNewAddress ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Buku Alamat
                  </button>
                  <button 
                    onClick={() => setIsAddingNewAddress(true)}
                    className={`flex-1 text-sm font-bold py-2 px-4 rounded-lg transition-all ${isAddingNewAddress ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Alamat Baru
                  </button>
                </div>
              )}

              {!isAddingNewAddress && addresses.length > 0 ? (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <label key={addr.id} className={`flex items-start p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/30'}`}>
                      <input 
                        type="radio" 
                        name="addressSelection" 
                        value={addr.id}
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="mt-1 w-4 h-4 text-primary focus:ring-primary border-gray-300"
                      />
                      <div className="ml-3 flex-1">
                        <p className="font-bold text-gray-900">{addr.label}</p>
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">{addr.full_address}</p>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nama</label>
                      <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Nama Lengkap" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">No. HP</label>
                      <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="081xxx" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Provinsi</label>
                      <input type="text" value={province} onChange={e => setProvince(e.target.value)} placeholder="Provinsi" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Kota</label>
                      <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="Kota" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Kecamatan</label>
                      <input type="text" value={district} onChange={e => setDistrict(e.target.value)} placeholder="Kecamatan" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex justify-between">
                      <span>Detail Alamat Lengkap</span>
                      <button 
                        type="button" 
                        onClick={() => handleManualGeocode(false)}
                        disabled={isGeocoding || !addressDetail}
                        className="text-[10px] bg-primary/10 text-primary hover:bg-primary/20 hover:scale-105 transition-all px-2 py-0.5 rounded-full flex items-center disabled:opacity-50"
                      >
                        {isGeocoding ? <Loader2 size={10} className="mr-1 animate-spin"/> : <Search size={10} className="mr-1"/>} 
                        Auto-Pin Peta
                      </button>
                    </label>
                    <textarea 
                      value={addressDetail}
                      onChange={(e) => setAddressDetail(e.target.value)}
                      placeholder="Jalan, Gedung, No. Rumah..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none h-20"
                    />
                  </div>

                  <LocationPicker onLocationSelect={(lat, lng) => setLocation({ lat, lng })} centerCoordinates={mapCenter} />

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={saveNewAddressToBook}
                        onChange={(e) => setSaveNewAddressToBook(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-bold text-gray-900">Simpan ke Buku Alamat</span>
                    </label>
                    
                    {saveNewAddressToBook && (
                      <div className="pt-2 animate-in slide-in-from-top-2">
                        <input
                          type="text"
                          placeholder="Label Alamat (Contoh: Rumah, Kantor)"
                          value={newAddressLabel}
                          onChange={(e) => setNewAddressLabel(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!selectedSchedule || (isAddingNewAddress && (!location || !addressDetail || (saveNewAddressToBook && !newAddressLabel))) || (!isAddingNewAddress && !selectedAddressId)}
              className="w-full h-14 bg-primary text-surface font-bold rounded-xl hover:bg-primary-dark transition-all duration-200 disabled:opacity-50 disabled:hover:transform-none flex items-center justify-center group"
            >
              Lanjut ke Estimasi <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <h3 className="text-lg font-bold flex items-center mb-2">
                <Sparkles size={20} className="text-primary mr-2" /> Estimasi Saldo dengan AI
              </h3>
              <p className="text-sm text-gray-500 mb-6">Unggah foto tumpukan sampah Anda untuk memprediksi kategori dan estimasi harga secara otomatis. Anda dapat melompati langkah ini.</p>
              
              <label className="border-2 border-dashed border-primary/30 bg-primary/5 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/10 transition-colors">
                <Upload size={40} className="text-primary mb-3" />
                <span className="text-sm font-bold text-gray-900">Pilih Foto Tumpukan Sampah</span>
                <span className="text-xs text-gray-500 mt-1">Format: JPG, PNG (Maks 5MB)</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>

              {file && (
                <div className="mt-4 flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-4 min-w-0">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  {!estimation && (
                    <button
                      onClick={analyzeImage}
                      disabled={loading}
                      className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Sparkles size={16} className="mr-2 text-yellow-400" />}
                      Analisis
                    </button>
                  )}
                </div>
              )}

              {estimation && (
                <div className="mt-4 bg-gradient-to-r from-primary/10 to-green-500/10 border border-primary/20 p-5 rounded-2xl flex justify-between items-center animate-in zoom-in-95 duration-300">
                  <div>
                    <p className="text-xs text-primary font-bold uppercase tracking-widest mb-1">Hasil Analisis AI</p>
                    <p className="text-xl font-extrabold text-gray-900">{estimation.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 font-medium">Estimasi Harga</p>
                    <p className="text-primary font-bold text-lg">~ Rp {estimation.price}<span className="text-sm text-gray-500 font-normal">/kg</span></p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col space-y-3 pt-4 border-t border-gray-100">
              <button
                onClick={submitBooking}
                disabled={loading}
                className="w-full h-14 bg-primary text-surface font-bold rounded-xl hover:bg-primary-dark transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : (estimation ? "Buat Tiket dengan Estimasi AI" : "Buat Tiket Sekarang")}
              </button>
              
              {!estimation && (
                <button
                  onClick={submitBooking}
                  disabled={loading}
                  className="w-full h-12 bg-transparent text-gray-500 font-semibold rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  <SkipForward size={18} className="mr-2" /> Lewati Estimasi & Buat Tiket
                </button>
              )}
              
              <button
                onClick={() => setStep(1)}
                disabled={loading}
                className="text-xs text-center text-gray-400 hover:text-gray-600 font-medium pt-2"
              >
                Kembali ke Pilih Jadwal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
