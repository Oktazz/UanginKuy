import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Ticket as TicketIcon, Calendar, ArrowRight, Info } from "lucide-react";

export default async function TicketsPage(props: { searchParams: Promise<{ tab?: string }> }) {
  const searchParams = await props.searchParams;
  const tab = searchParams?.tab || "active";
  const supabase = await createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let query = supabase
    .from("tickets")
    .select("*, schedules(*)")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });

  if (tab === "history") {
    query = query.in("status", ["completed", "cancelled"]);
  } else {
    query = query.in("status", ["pending", "scheduled", "on_the_way"]);
  }

  const { data: tickets } = await query;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4  border-gray-200 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Tiket Jemput</h2>
          <p className="text-sm text-gray-500 mt-1">Daftar permintaan penjemputan sampah aktif dan riwayat Anda.</p>
        </div>
        <Link href="/booking" className="inline-flex items-center justify-center bg-primary text-surface px-6 py-3 rounded-2xl text-sm font-semibold shadow-md hover:bg-primary-dark hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5">
          <TicketIcon size={18} className="mr-2" /> Buat Tiket Baru
        </Link>
      </header>

      <div className="flex bg-gray-100/50 p-1 rounded-xl mb-6">
        <Link 
          href="/tickets?tab=active" 
          className={`flex-1 text-center py-2.5 rounded-lg text-sm font-bold transition-all ${tab === 'active' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Tiket Aktif
        </Link>
        <Link 
          href="/tickets?tab=history" 
          className={`flex-1 text-center py-2.5 rounded-lg text-sm font-bold transition-all ${tab === 'history' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Riwayat Selesai
        </Link>
      </div>

      <div className="space-y-6">
        {(!tickets || tickets.length === 0) ? (
          <div className="text-center py-20 bg-white/50 backdrop-blur-sm border-2 border-dashed border-gray-200 rounded-3xl">
            <div className="w-20 h-20 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <TicketIcon size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Belum Ada Tiket</h3>
            <p className="text-sm text-gray-500 mt-2 mb-8 max-w-sm mx-auto">Anda belum pernah membuat jadwal penjemputan. Mulai kumpulkan sampah dan jadikan penghasilan tambahan.</p>
            <Link href="/booking" className="text-primary font-bold hover:text-primary-dark transition-colors inline-flex items-center">
              Mulai Tukar Sampah <ArrowRight size={16} className="ml-2" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-5">
            {tickets.map((ticket: any) => {
              const statusColors: Record<string, string> = {
                pending: 'bg-warning/10 text-warning border-warning/20',
                completed: 'bg-success/10 text-success border-success/20',
                cancelled: 'bg-error/10 text-error border-error/20'
              };
              const statusLabel: Record<string, string> = {
                pending: 'Menunggu Kurir',
                completed: 'Selesai',
                cancelled: 'Dibatalkan'
              };
              
              const dateObj = new Date(ticket.pickup_date);
              const day = dateObj.toLocaleDateString('id-ID', { day: '2-digit' });
              const month = dateObj.toLocaleDateString('id-ID', { month: 'short' });
              const year = dateObj.getFullYear();
              const ticketIdShort = ticket.short_id ? ticket.short_id.toUpperCase() : ticket.id.split('-')[0].toUpperCase();

              return (
                <Link 
                  key={ticket.id} 
                  href={`/tickets/${ticket.id}`}
                  className="block group"
                >
                  <div className="flex flex-col sm:flex-row bg-surface rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden relative transform hover:-translate-y-1">
                    
                    {/* Left/Top Part: Date & ID */}
                    <div className="bg-primary/5 sm:w-1/3 p-6 flex flex-col justify-center border-b sm:border-b-0 sm:border-r border-dashed border-gray-200 relative">
                      <div className="absolute top-0 right-0 p-3 opacity-10">
                        <Calendar size={60} />
                      </div>
                      <span className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Jadwal Jemput</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-5xl font-extrabold text-gray-900 tracking-tighter leading-none">{day}</span>
                        <div className="flex flex-col justify-center">
                          <span className="text-sm font-bold text-gray-700 uppercase leading-none mb-1">{month}</span>
                          <span className="text-xs text-gray-500 font-medium leading-none">{year}</span>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200/50 flex justify-between items-center space-x-2 text-gray-500">
                        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">ID: {ticketIdShort}</span>
                        <div className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border ${statusColors[ticket.status] || 'bg-gray-100 text-gray-600'}`}>
                          {statusLabel[ticket.status] || ticket.status}
                        </div>                       
                      </div>
                      
                    </div>
                    
                    {/* Right/Bottom Part: Details & Status */}
                    <div className="p-6 flex-1 flex flex-col justify-between bg-white relative">
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                          <h3 className="font-bold text-gray-900 text-lg group-hover:text-primary transition-colors">
                            {ticket.ai_predicted_category || "Kategori Belum Tersedia"}
                          </h3>
                          <p className="text-sm text-gray-500 flex items-center">
                            <Info size={14} className="mr-1.5" />
                            Estimasi: {ticket.ai_estimated_price ? `Rp ${ticket.ai_estimated_price}/kg` : "Menunggu penimbangan"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center text-sm font-medium text-primary">
                          Lihat E-Tiket 
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                          <ArrowRight size={16} className="text-gray-400 group-hover:text-primary transition-colors transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Cutout circles for ticket effect */}
                    <div className="hidden sm:block absolute -top-3 left-[33.333%] w-6 h-6 bg-[var(--color-background)] rounded-full transform -translate-x-1/2"></div>
                    <div className="hidden sm:block absolute -bottom-3 left-[33.333%] w-6 h-6 bg-[var(--color-background)] rounded-full transform -translate-x-1/2"></div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
