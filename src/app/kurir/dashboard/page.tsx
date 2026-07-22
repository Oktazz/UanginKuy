import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { CourierMap } from "@/components/ui/CourierMap";
import { MapPin, Navigation, Phone, CheckCircle2, MoreVertical } from "lucide-react";
import Link from "next/link";

export default async function CourierDashboard() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  // Fetch assigned tickets
  // Need to cast the join because Supabase types might not infer the inner join fields perfectly
  const { data: ticketsData } = await supabase
    .from('tickets')
    .select(`
      id, 
      client_id, 
      status, 
      route_sequence,
      profiles!client_id (
        name, 
        address, 
        phone_number
      )
    `)
    .eq('courier_id', user?.id)
    .in('status', ['scheduled', 'on_the_way'])
    .order('route_sequence', { ascending: true });

  const tickets = (ticketsData as any[]) || [];

  return (
    <div className="space-y-6 pb-8 max-w-lg mx-auto">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Rute Hari Ini</h2>
        <p className="text-sm text-gray-500 mt-1">Daftar penjemputan sampah yang ditugaskan kepada Anda.</p>
      </header>

      {/* Map Component */}
      <section>
        <CourierMap tickets={tickets} />
      </section>

      {/* Route List */}
      <section className="space-y-4 mt-8">
        <h3 className="font-bold text-lg text-gray-900 flex items-center">
          Daftar Penjemputan
          <span className="ml-3 px-2 py-0.5 bg-secondary text-primary-dark text-xs font-extrabold rounded-full">{tickets.length}</span>
        </h3>
        
        {tickets.length === 0 ? (
          <div className="bg-surface rounded-3xl p-8 text-center border border-gray-100 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-gray-300" />
            </div>
            <h4 className="font-bold text-gray-700">Tidak ada jadwal</h4>
            <p className="text-sm text-gray-500 mt-2">Anda belum ditugaskan untuk rute penjemputan apapun hari ini.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket, index) => {
              const profile = ticket.profiles;
              const isFirst = index === 0;
              // Mock coordinates for google maps deep link
              const mockLat = -6.17511 + ((index + 1) * 0.005);
              const mockLng = 106.827153 + ((index + 1) * 0.005);
              
              return (
                <div key={ticket.id} className={`bg-surface rounded-3xl p-5 shadow-sm border transition-all ${isFirst ? 'border-primary ring-1 ring-primary/20 shadow-md' : 'border-gray-100'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isFirst ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 leading-tight">{profile.name}</h4>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 inline-block ${ticket.status === 'on_the_way' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                          {ticket.status === 'on_the_way' ? 'Menuju Lokasi' : 'Terjadwal'}
                        </span>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical size={20} />
                    </button>
                  </div>
                  
                  <div className="flex items-start space-x-3 text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-2xl">
                    <MapPin size={16} className="text-primary mt-0.5 shrink-0" />
                    <p className="line-clamp-2 leading-snug">{profile.address || 'Alamat tidak tersedia'}</p>
                  </div>

                  <div className="flex items-center space-x-3 mt-4">
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${mockLat},${mockLng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-gray-100 text-gray-700 font-semibold py-2.5 rounded-2xl flex items-center justify-center space-x-2 hover:bg-gray-200 transition"
                    >
                      <Navigation size={18} />
                      <span>Arahkan</span>
                    </a>
                    
                    <Link href={`/kurir/pickup/${ticket.id}`} className="flex-1 bg-primary text-white font-semibold py-2.5 rounded-2xl flex items-center justify-center space-x-2 shadow-md hover:bg-primary-dark transition">
                      <CheckCircle2 size={18} />
                      <span>Proses</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
