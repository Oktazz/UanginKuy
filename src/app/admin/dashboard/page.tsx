import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { Users, Ticket, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AdminChart } from "@/components/ui/AdminChart";

export default async function AdminDashboard() {
  const supabase = await createClient(await cookies());

  // 1. Get total users
  const { count: usersCount } = await supabase
    .from("profiles")
    .select("*", { count: 'exact', head: true })
    .eq("role", "nasabah");

  // 2. Get total tickets
  const { count: ticketsCount } = await supabase
    .from("tickets")
    .select("*", { count: 'exact', head: true });

  // 3. Get total completed transactions
  const { data: transactions } = await supabase
    .from("transaction_details")
    .select("weight, subtotal");

  let totalWeight = 0;
  let totalRevenue = 0;
  
  if (transactions) {
    totalWeight = transactions.reduce((acc, curr) => acc + (Number(curr.weight) || 0), 0);
    totalRevenue = transactions.reduce((acc, curr) => acc + (Number(curr.subtotal) || 0), 0);
  }

  const kpis = [
    {
      title: "Total Nasabah",
      value: usersCount || 0,
      trend: "+12% dari minggu lalu",
      isPositive: true,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Total Tiket",
      value: ticketsCount || 0,
      trend: "+5% dari minggu lalu",
      isPositive: true,
      icon: Ticket,
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
    {
      title: "Total Sampah Terkumpul",
      value: `${totalWeight.toFixed(1)} Kg`,
      trend: "-2% dari minggu lalu",
      isPositive: false,
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Total Transaksi Keluar",
      value: `Rp ${totalRevenue.toLocaleString('id-ID')}`,
      trend: "+18% dari minggu lalu",
      isPositive: true,
      icon: Wallet,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard Overview</h2>
        <p className="text-gray-500 mt-2 font-medium">Ringkasan aktivitas platform UanginKuy hari ini.</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div key={index} className="bg-surface rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${kpi.bg}`}>
                  <Icon size={24} className={kpi.color} />
                </div>
                <div className={`flex items-center space-x-1 text-xs font-bold px-2 py-1 rounded-full ${kpi.isPositive ? 'text-success bg-success/10' : 'text-error bg-error/10'}`}>
                  {kpi.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  <span>{kpi.trend.split(' ')[0]}</span>
                </div>
              </div>
              <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">{kpi.title}</h3>
              <p className="text-3xl font-black text-gray-900 tracking-tight">{kpi.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface rounded-3xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Volume Sampah (7 Hari Terakhir)</h3>
              <p className="text-sm text-gray-500 mt-1">Tren berat sampah harian dalam kilogram.</p>
            </div>
            <select className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-primary focus:border-primary block p-2.5 font-medium outline-none">
              <option>Minggu Ini</option>
              <option>Bulan Ini</option>
              <option>Tahun Ini</option>
            </select>
          </div>
          <div className="h-80">
            <AdminChart />
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-surface rounded-3xl p-8 shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Aktivitas Terbaru</h3>
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Ticket size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Tiket Penjemputan Selesai</p>
                  <p className="text-xs text-gray-500 mt-1">Budi Santoso - 4.5 Kg Plastik</p>
                  <span className="text-[10px] font-bold text-gray-400 uppercase mt-2 inline-block">{i * 15} Menit yang lalu</span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-3 text-sm font-bold text-primary bg-primary/5 hover:bg-primary/10 rounded-xl transition-colors">
            Lihat Semua Aktivitas
          </button>
        </div>
      </div>
    </div>
  );
}
