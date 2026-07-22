"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Weight, MapPin, Loader2, Save, Wifi, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Category {
  id: number;
  name: string;
  price_per_kg: number;
}

export default function PickupPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ticket, setTicket] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [weight, setWeight] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // In a real app, fetch from Supabase
    // Mock data for UI prototype
    setTimeout(() => {
      setTicket({
        id: ticketId,
        profiles: { name: "Budi Santoso", address: "Jl. Melati No. 42, Jakarta" },
        ai_predicted_category: "Plastik",
        ai_estimated_price: 15000,
        status: "on_the_way"
      });
      setCategories([
        { id: 1, name: "Plastik", price_per_kg: 3000 },
        { id: 2, name: "Kertas", price_per_kg: 2000 },
        { id: 3, name: "Logam", price_per_kg: 5000 }
      ]);
      setCategoryId("1"); // default matching AI maybe
      setLoading(false);
    }, 800);
  }, [ticketId]);

  const handleSyncIoT = () => {
    setIsSyncing(true);
    // Simulate IoT delay
    setTimeout(() => {
      // Mock weight from smart scale
      const mockWeight = (Math.random() * 5 + 1).toFixed(2);
      setWeight(mockWeight);
      setIsSyncing(false);
    }, 1500);
  };

  const selectedCategory = categories.find(c => c.id.toString() === categoryId);
  const numWeight = parseFloat(weight) || 0;
  const subtotal = selectedCategory ? (numWeight * selectedCategory.price_per_kg) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Simulate API call to complete ticket
    setTimeout(() => {
      router.push('/kurir/dashboard');
    }, 1200);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-[50vh]"><Loader2 size={32} className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-md mx-auto pb-8">
      <header className="mb-6 flex items-center space-x-3">
        <Link href="/kurir/scanner" className="w-10 h-10 bg-surface rounded-full flex items-center justify-center shadow-sm text-gray-700 hover:bg-gray-50 transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Selesaikan Penjemputan</h2>
          <p className="text-xs text-gray-500 font-medium">Ticket ID: {ticketId.substring(0,8)}...</p>
        </div>
      </header>

      {/* Client Info Card */}
      <div className="bg-surface rounded-3xl p-5 shadow-sm border border-gray-100 mb-6 flex items-start space-x-4">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
          <User size={24} className="text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">{ticket.profiles.name}</h3>
          <div className="flex items-start space-x-1 text-xs text-gray-500 mt-1">
            <MapPin size={14} className="mt-0.5 shrink-0" />
            <span>{ticket.profiles.address}</span>
          </div>
          {ticket.ai_predicted_category && (
            <div className="mt-2 inline-block bg-secondary text-primary-dark text-xs font-bold px-2 py-1 rounded-full">
              Estimasi AI: {ticket.ai_predicted_category}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Waste Category Selection */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-900 ml-1">Kategori Sampah (Aktual)</label>
          <div className="relative">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full appearance-none bg-surface border border-gray-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-gray-800"
              required
            >
              <option value="" disabled>Pilih kategori...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name} - Rp {c.price_per_kg}/kg</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
              <ChevronDown size={20} />
            </div>
          </div>
        </div>

        {/* Weight Input */}
        <div className="space-y-2">
          <div className="flex justify-between items-end mb-1 ml-1">
            <label className="text-sm font-bold text-gray-900">Berat Sampah (kg)</label>
          </div>
          
          <div className="flex space-x-3">
            <div className="relative flex-1">
              <input
                type="number"
                step="0.01"
                min="0.1"
                placeholder="0.00"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full bg-surface border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-bold text-lg text-gray-800"
                required
              />
              <Weight size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            
            <button
              type="button"
              onClick={handleSyncIoT}
              disabled={isSyncing}
              className={`shrink-0 flex items-center justify-center px-4 rounded-2xl font-bold text-xs transition-all shadow-sm
                ${isSyncing ? 'bg-gray-100 text-gray-400' : 'bg-[#E7E1B1] text-primary-dark hover:bg-[#d9d3a1]'}`}
            >
              {isSyncing ? <Loader2 size={18} className="animate-spin" /> : (
                <>
                  <Wifi size={16} className="mr-2" /> IoT Sync
                </>
              )}
            </button>
          </div>
        </div>

        {/* Total Calculation */}
        <div className="bg-primary text-white rounded-3xl p-6 mt-8 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <p className="text-primary-100 text-sm font-medium">Total Pembayaran Nasabah</p>
          <div className="text-3xl font-extrabold mt-1 tracking-tight">
            Rp {subtotal.toLocaleString('id-ID')}
          </div>
          
          <button
            type="submit"
            disabled={submitting || !weight || numWeight <= 0}
            className="w-full bg-white text-primary mt-6 py-3.5 rounded-xl font-bold flex justify-center items-center hover:bg-gray-50 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 size={20} className="animate-spin" /> : (
              <>
                <Save size={18} className="mr-2" /> Selesaikan & Bayar
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
