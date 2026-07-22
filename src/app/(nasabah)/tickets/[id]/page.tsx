"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useParams } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TicketDetailPage() {
  const params = useParams();
  const ticketId = params.id as string;
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app we'd fetch one ticket specifically, 
    // but for now we'll fetch all and find it since we only implemented GET /api/tickets
    fetch('/api/tickets')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const t = data.data.find((x: any) => x.id === ticketId);
          setTicket(t);
        }
        setLoading(false);
      });
  }, [ticketId]);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  if (!ticket) return <div className="text-center p-12 text-gray-500">Tiket tidak ditemukan.</div>;

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Link href="/tickets" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary transition-colors">
        <ArrowLeft size={16} className="mr-1" /> Kembali ke Daftar Tiket
      </Link>

      <div className="bg-surface rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-primary p-6 text-center text-surface">
          <h2 className="text-xl font-bold uppercase tracking-wider">E-Tiket Jemput</h2>
          <p className="text-sm opacity-90 mt-1">
            {new Date(ticket.schedules?.operational_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        
        <div className="p-8 flex flex-col items-center">
          <div className="bg-white p-4 rounded-xl shadow-inner border border-gray-100">
            <QRCodeSVG value={ticket.id} size={200} />
          </div>
          
          <p className="text-xs text-gray-400 mt-4 uppercase tracking-widest font-mono">ID: {ticket.id.split('-')[0]}</p>
          
          <div className="w-full mt-8 space-y-4 border-t border-dashed border-gray-200 pt-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Status</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize
                ${ticket.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}
                ${ticket.status === 'completed' ? 'bg-green-100 text-green-700' : ''}
              `}>
                {ticket.status}
              </span>
            </div>
            
            {ticket.ai_predicted_category && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Estimasi AI</span>
                <span className="text-sm font-semibold text-gray-900">{ticket.ai_predicted_category}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <p className="text-center text-xs text-gray-500 px-4">
        Tunjukkan QR Code ini kepada kurir saat penjemputan untuk memulai proses penimbangan IoT.
      </p>
    </div>
  );
}
