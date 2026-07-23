import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Wallet, Leaf, ArrowRight } from "lucide-react";
import Link from "next/link";
import { WastePieChart } from "@/components/ui/WastePieChart";

export default async function DashboardPage() {
  const supabase = await createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch profile for balance
  const { data: profile } = await supabase
    .from("profiles")
    .select("balance, name")
    .eq("id", user.id)
    .single();

  // Fetch historical transactions for pie chart
  // Join via tickets!inner to filter by client_id — explicit filter on top of RLS
  const { data: transactions } = await supabase
    .from("transaction_details")
    .select(`
      weight,
      waste_categories ( name ),
      tickets!inner ( client_id )
    `)
    .eq("tickets.client_id", user.id)
    .limit(100);

  // Aggregate data for Pie Chart
  const categoryTotals: Record<string, number> = {};
  let totalWeight = 0;
  
  if (transactions) {
    transactions.forEach((tx: any) => {
      const catName = tx.waste_categories?.name || 'Lainnya';
      categoryTotals[catName] = (categoryTotals[catName] || 0) + (Number(tx.weight) || 0);
      totalWeight += Number(tx.weight) || 0;
    });
  }

  // Predefined colors for the chart
  const colors = ['#306D29', '#E7E1B1', '#22C55E', '#F59E0B', '#3B82F6'];
  const chartData = Object.keys(categoryTotals).map((key, index) => ({
    label: key,
    value: categoryTotals[key],
    color: colors[index % colors.length]
  }));

  const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  });

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Halo, {profile?.name || 'Nasabah'}!</h2>
          <p className="text-sm text-gray-500">Selamat datang kembali di UanginKuy</p>
        </div>
      </header>

      {/* Balance Card */}
      <section className="bg-primary text-surface p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <Wallet size={80} />
        </div>
        <p className="text-sm opacity-90 font-medium">Total Saldo Aktif</p>
        <h1 className="text-3xl md:text-4xl font-bold mt-2">{formatter.format(profile?.balance || 0)}</h1>
        <div className="mt-6 flex justify-between items-center">
          <Link href="/withdrawal" className="bg-surface text-primary px-4 py-2 rounded-2xl text-sm font-semibold shadow hover:bg-gray-100 transition">
            Tarik Saldo
          </Link>
          <Link href="/tickets" className="text-sm flex items-center hover:underline opacity-90">
            Riwayat <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>
      </section>

      {/* Impact Tracker */}
      <section className="bg-[#E7E1B1] p-6 rounded-2xl shadow-sm flex items-center space-x-4">
        <div className="bg-primary p-3 rounded-full text-surface flex-shrink-0">
          <Leaf size={28} />
        </div>
        <div>
          <h3 className="text-md font-bold text-gray-900">Jejak Lingkungan Positif</h3>
          <p className="text-sm text-gray-700 mt-1">
            Anda telah menyelamatkan <strong className="text-primary-dark">{totalWeight} kg</strong> sampah dari TPA! Ini setara dengan mengurangi sekitar <strong>{(totalWeight * 2.5).toFixed(1)} kg emisi karbon</strong>.
          </p>
        </div>
      </section>

      {/* Chart Section */}
      <section className="bg-surface p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Proporsi Sampah Anda</h3>
        <WastePieChart data={chartData} />
      </section>
    </div>
  );
}
