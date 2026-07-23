"use client";

import { useState } from "react";
import { Map, Zap, User, MapPin, CheckCircle, Clock } from "lucide-react";
import { assignCourier, generateOptimalRoutes } from "./actions";

export default function RouteClient({ tickets, couriers }: { tickets: any[], couriers: any[] }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAssign = async (ticketId: string, courierId: string) => {
    await assignCourier(ticketId, courierId);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    await generateOptimalRoutes();
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Manajemen Rute</h2>
          <p className="text-gray-500 mt-2 font-medium">Atur penugasan kurir dan hitung rute paling optimal (VRP).</p>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center space-x-2 bg-gray-900 text-white px-5 py-3 rounded-xl font-bold hover:bg-black transition-all shadow-sm disabled:opacity-50"
        >
          <Zap size={20} className={isGenerating ? "animate-pulse" : ""} />
          <span>{isGenerating ? "Menghitung Rute..." : "Generate Rute Optimal"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-surface border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Daftar Tiket Penjemputan</h3>
            <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">{tickets.length} Tiket Aktif</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 font-bold text-gray-500 text-sm uppercase tracking-wider">ID Tiket / Nasabah</th>
                  <th className="px-6 py-4 font-bold text-gray-500 text-sm uppercase tracking-wider">Status & Urutan</th>
                  <th className="px-6 py-4 font-bold text-gray-500 text-sm uppercase tracking-wider">Penugasan Kurir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="font-bold text-gray-900">
                        {ticket.profiles?.name || 'Nasabah Anonim'}
                      </div>
                      <div className="text-xs text-gray-400 font-medium mt-1 flex items-center space-x-1">
                        <MapPin size={12} />
                        <span className="truncate max-w-[200px] inline-block">{ticket.profiles?.address || 'Alamat tidak diketahui'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col space-y-2">
                        {ticket.status === 'scheduled' ? (
                           <span className="inline-flex w-fit items-center space-x-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[10px] font-bold uppercase">
                             <Clock size={12} /> <span>Terjadwal</span>
                           </span>
                        ) : ticket.status === 'pending' ? (
                           <span className="inline-flex w-fit items-center space-x-1 px-2 py-0.5 rounded-md bg-warning/10 text-warning-dark text-[10px] font-bold uppercase">
                             <Clock size={12} /> <span>Pending</span>
                           </span>
                        ) : (
                           <span className="inline-flex w-fit items-center space-x-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-bold uppercase">
                             <span>{ticket.status}</span>
                           </span>
                        )}

                        {ticket.route_sequence ? (
                           <div className="text-xs font-bold text-primary flex items-center space-x-1">
                             <CheckCircle size={14} /> <span>Urutan ke-{ticket.route_sequence}</span>
                           </div>
                        ) : (
                           <div className="text-[10px] font-bold text-gray-400 italic">Belum diurutkan</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <select 
                        value={ticket.courier_id || ""}
                        onChange={(e) => handleAssign(ticket.id, e.target.value)}
                        className={`w-full bg-white border ${ticket.courier_id ? 'border-primary/30 text-primary font-bold' : 'border-gray-200 text-gray-500 font-medium'} rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all`}
                      >
                        <option value="">-- Belum Ditugaskan --</option>
                        {couriers.map(c => (
                          <option key={c.id} value={c.id}>{c.name || 'Kurir'}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {tickets.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                      Tidak ada tiket yang aktif saat ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-surface border border-gray-100 rounded-3xl p-8 shadow-sm h-fit sticky top-8">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
            <Map size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Simulasi Algoritma VRP</h3>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            Sistem secara otomatis akan menghitung jarak antar titik penjemputan dan menentukan urutan kunjungan yang paling hemat bahan bakar dan waktu (Vehicle Routing Problem).
          </p>
          <div className="space-y-4">
             <div className="flex items-center space-x-3 text-sm font-bold text-gray-700">
               <div className="w-6 h-6 rounded-full bg-success/20 text-success flex items-center justify-center"><CheckCircle size={14} /></div>
               <span>Clustering Kurir</span>
             </div>
             <div className="flex items-center space-x-3 text-sm font-bold text-gray-700">
               <div className="w-6 h-6 rounded-full bg-success/20 text-success flex items-center justify-center"><CheckCircle size={14} /></div>
               <span>Optimasi Jarak (Haversine)</span>
             </div>
             <div className="flex items-center space-x-3 text-sm font-bold text-gray-700">
               <div className="w-6 h-6 rounded-full bg-success/20 text-success flex items-center justify-center"><CheckCircle size={14} /></div>
               <span>Penugasan Otomatis</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
