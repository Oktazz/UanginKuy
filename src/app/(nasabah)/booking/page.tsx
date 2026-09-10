"use client";

import { useState, useEffect } from "react";
import { Calendar, MapPin, Search, Plus, ArrowLeft, TicketCheck } from "lucide-react";
import { LocationPicker } from "@/components/ui/LocationPicker";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { geocodeWithFallbacks } from "@/utils/geocoding";
import { useRouter } from "next/navigation";
import { formatLocalDateToYMD } from "@/utils/date";

export default function BookingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [bookingError, setBookingError] = useState("");

  // Form State
  const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<number | null>(null);
  const [selectedPickupDate, setSelectedPickupDate] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<{ date: Date; dateStr: string; scheduleId: number }[]>([]);

  useEffect(() => {
    if (schedules.length > 0) {
      const dates = [];
      const today = new Date();
      today.setHours(0,0,0,0);
      
      let d = new Date(today);
      d.setDate(d.getDate() + 1); // Mulai dari besok
      
      for (let i = 0; i < 7; i++) {
        const currentDayOfWeek = d.getDay();
        const matchingSchedule = schedules.find(s => s.day_of_week === currentDayOfWeek);
        if (matchingSchedule) {
          dates.push({
            date: new Date(d),
            dateStr: formatLocalDateToYMD(d),
            scheduleId: matchingSchedule.id
          });
        }
        d.setDate(d.getDate() + 1);
      }
      setAvailableDates(dates);
    }
  }, [schedules]);
  
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [saveNewAddressToBook, setSaveNewAddressToBook] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [newAddressLabel, setNewAddressLabel] = useState("");
  
  const [recipientName, setRecipientName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");

  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [addressDetail, setAddressDetail] = useState("");
  
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
      const queries = [
        `${addressDetail}, ${district}, ${city}, ${province}`,
        `${district}, ${city}, ${province}`,
        `${city}, ${province}`,
      ];
      const coords = await geocodeWithFallbacks(queries);

      if (coords) {
        setMapError(null);
        setMapCenter(coords);
      } else if (!silent) {
        setMapError("Lokasi presisi tidak ditemukan, silakan geser peta secara manual.");
      }
    } catch (err) {
      console.error("Geocoding failed", err);
    } finally {
      setIsGeocoding(false);
    }
  };

  // Fetch Schedules & Addresses on Mount
  useEffect(() => {
    Promise.all([
      fetch('/api/schedules/active').then(res => res.json()),
      fetch('/api/addresses').then(res => res.json()),
    ])
      .then(([schedulesData, addressesData]) => {
        if (schedulesData?.success) setSchedules(schedulesData.data);
        if (addressesData?.success && addressesData.data.length > 0) {
          setAddresses(addressesData.data);
          setSelectedAddressId(addressesData.data[0].id); // Default to primary/first
        } else {
          setIsAddingNewAddress(true); // Force new address if none exists
          setSaveNewAddressToBook(true);
        }
      })
      .catch((err) => {
        console.error("Failed loading booking dependencies", err);
      })
      .finally(() => {
        setLoadingData(false);
      });
  }, []);

  const submitBooking = async () => {
    if (!selectedSchedule || !selectedPickupDate) return;
    if (isAddingNewAddress && !location) return;
    if (!isAddingNewAddress && !selectedAddressId) return;

    setBookingError("");
    setLoading(true);
    try {
      let finalAddressId = selectedAddressId;

      // If user is adding a new address, we MUST save it to the address book
      // because tickets now strictly require an address_id.
      if (isAddingNewAddress && location) {
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

      const ticketPayload = {
        schedule_id: selectedSchedule,
        pickup_date: selectedPickupDate,
        address_id: finalAddressId,
      };

      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketPayload)
      });
      const data = await response.json();
      if (data.success) {
        router.push(`/tickets/${data.data.id}`);
        return;
      }

      setBookingError(
        response.status === 409
          ? "Tiket untuk tanggal dan alamat ini sudah ada. Pilih tanggal atau alamat lain."
          : data.error || "Tiket belum berhasil dibuat. Silakan coba lagi."
      );
    } catch (err) {
      console.error(err);
      setBookingError("Terjadi gangguan koneksi. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl pb-8">
      <header className="flex items-center space-x-3 mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-9 h-9 bg-surface border border-gray-200 rounded-xl flex items-center justify-center shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 cursor-pointer flex-shrink-0"
          aria-label="Kembali"
        >
          <ArrowLeft size={18} className="text-gray-700" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Buat Jadwal Jemput</h2>
      </header>

      <div className="bg-surface rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 relative overflow-hidden">
        {loadingData ? (
          <div className="space-y-8 animate-pulse">
            {/* Skeleton Section 1: Pilih Tanggal */}
            <div>
              <div className="flex items-center mb-4">
                <Skeleton className="w-5 h-5 rounded-md mr-2" />
                <Skeleton className="h-6 w-44 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-2xl border-2 border-gray-100 bg-gray-50/70 h-20 flex flex-col justify-center items-center space-y-2">
                    <Skeleton className="h-4 w-20 rounded" />
                    <Skeleton className="h-3 w-28 rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* Skeleton Section 2: Pilih Alamat */}
            <div>
              <div className="flex items-center mb-4">
                <Skeleton className="w-5 h-5 rounded-md mr-2" />
                <Skeleton className="h-6 w-40 rounded-lg" />
              </div>
              <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-4 w-36 rounded" />
                <Skeleton className="h-7 w-24 rounded-lg" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-2xl border-2 border-gray-100 bg-gray-50/70 h-24 flex items-start space-x-3">
                    <Skeleton className="w-4 h-4 rounded-full mt-1 shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-24 rounded" />
                      <Skeleton className="h-3 w-full rounded" />
                      <Skeleton className="h-3 w-4/5 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skeleton Submit Button */}
            <div className="border-t border-gray-100 pt-6">
              <Skeleton className="w-full h-14 rounded-xl" />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold flex items-center mb-4">
                <Calendar size={20} className="text-primary mr-2" /> Pilih Tanggal Jemput
              </h3>
              
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {availableDates.map((item) => (
                  <button
                    key={item.dateStr}
                    onClick={() => { setSelectedSchedule(item.scheduleId); setSelectedPickupDate(item.dateStr); }}
                    className={`p-4 rounded-2xl border-2 text-center transition-all duration-200 ${selectedPickupDate === item.dateStr ? 'border-primary bg-primary/10 text-primary shadow-sm transform scale-[1.02]' : 'border-gray-200 hover:border-primary/40 text-gray-700 hover:bg-gray-50'}`}
                  >
                    <span className="block text-sm font-bold">
                      {item.date.toLocaleDateString('id-ID', { weekday: 'long' })}
                    </span>
                    <span className="block text-xs mt-1 opacity-80">
                      {item.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </button>
                ))}
                {availableDates.length === 0 && (
                  <div className="col-span-2 text-center text-sm text-gray-500 py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200 md:col-span-3">
                    Belum ada jadwal buka dari Pengepul.
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold flex items-center mb-4">
                <MapPin size={20} className="text-primary mr-2" /> Konfirmasi Lokasi
              </h3>

              {addresses.length > 0 && !isAddingNewAddress && (
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-gray-600">Pilih dari Buku Alamat</span>
                  <button 
                    onClick={() => setIsAddingNewAddress(true)}
                    className="text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-all flex items-center"
                  >
                    <Plus size={14} className="mr-1" />
                    Tambah Baru
                  </button>
                </div>
              )}

              {addresses.length > 0 && isAddingNewAddress && (
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-gray-600">Buat Alamat Baru</span>
                  <button 
                    onClick={() => setIsAddingNewAddress(false)}
                    className="text-xs font-bold bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-all flex items-center"
                  >
                    <ArrowLeft size={14} className="mr-1" />
                    Batal
                  </button>
                </div>
              )}

              {!isAddingNewAddress && addresses.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
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
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        onClick={() => handleManualGeocode(false)}
                        disabled={!addressDetail}
                        loading={isGeocoding}
                        loadingLabel="Auto-Pin Peta"
                        className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary hover:scale-105 hover:bg-primary/20 disabled:opacity-50"
                      >
                        <Search size={10} className="mr-1" />
                        Auto-Pin Peta
                      </Button>
                    </label>
                    <textarea 
                      value={addressDetail}
                      onChange={(e) => setAddressDetail(e.target.value)}
                      placeholder="Jalan, Gedung, No. Rumah..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none h-20"
                    />
                  </div>

                  <LocationPicker onLocationSelect={(lat, lng) => setLocation({ lat, lng })} centerCoordinates={mapCenter} />
                  <ErrorAlert message={mapError} />

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={addresses.length === 0 ? true : saveNewAddressToBook}
                        onChange={(e) => setSaveNewAddressToBook(e.target.checked)}
                        disabled={addresses.length === 0}
                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                      />
                      <span className="text-sm font-bold text-gray-900">Simpan ke Buku Alamat</span>
                    </label>
                    {addresses.length === 0 && (
                      <p className="text-[11px] text-orange-600 font-medium ml-8 mt-1">
                        * Wajib menyimpan minimal 1 alamat untuk kemudahan penjemputan.
                      </p>
                    )}
                    
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

            <div className="flex flex-col space-y-3 border-t border-gray-100 pt-6">
              <ErrorAlert message={bookingError} />

              <Button
                onClick={submitBooking}
                disabled={!selectedSchedule || (isAddingNewAddress && (!location || !addressDetail || !newAddressLabel)) || (!isAddingNewAddress && !selectedAddressId)}
                loading={loading}
                loadingLabel="Buat Tiket Sekarang"
                className="h-14 w-full rounded-xl bg-primary font-bold text-surface shadow-md hover:bg-primary-dark hover:shadow-lg disabled:opacity-50"
              >
                <TicketCheck size={20} className="mr-2" />
                Buat Tiket Sekarang
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
