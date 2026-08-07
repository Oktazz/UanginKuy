import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Wallet, Leaf, ArrowRight, Recycle } from "lucide-react";
import Link from "next/link";
import { WastePieChart } from "@/components/ui/WastePieChart";
import { NewsSection } from "@/components/ui/NewsSection";
import { OnboardingModal } from "@/components/OnboardingModal";
import { completeOnboarding } from "./actions";

export default async function DashboardPage(props: {
  searchParams: Promise<{ onboardingError?: string }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("balance, name, onboarding_completed_at")
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
    transactions.forEach((tx) => {
      const wasteCategory = Array.isArray(tx.waste_categories)
        ? tx.waste_categories[0]
        : tx.waste_categories;
      const catName = wasteCategory?.name || 'Lainnya';
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
      {profile?.onboarding_completed_at === null && (
        <OnboardingModal completeAction={completeOnboarding} />
      )}

      <header className="flex items-center gap-3 sm:gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white sm:h-14 sm:w-14"
          aria-hidden="true"
        >
          <Recycle size={28} strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl">
            Uangin<span className="text-primary">Kuy</span>
          </h1>
          <p className="text-sm font-medium text-gray-500">
            Ubah Sampah Jadi Uang
          </p>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Balance Card */}
        <section className="relative h-full overflow-hidden rounded-2xl bg-primary p-6 text-surface shadow-lg">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Wallet size={80} />
          </div>
          <p className="text-sm opacity-90 font-medium">Total Saldo Aktif</p>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl">{formatter.format(profile?.balance || 0)}</h1>
          <div className="mt-6 flex items-center justify-between">
            <Link href="/withdrawal" className="bg-surface text-primary px-4 py-2 rounded-2xl text-sm font-semibold shadow hover:bg-gray-100 transition">
              Tarik Saldo
            </Link>
            <Link href="/tickets?tab=history" className="text-sm flex items-center hover:underline opacity-90">
              Riwayat <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
        </section>

        {/* Impact Tracker */}
        <section className="flex h-full items-center space-x-4 rounded-2xl bg-[#E7E1B1] p-6 shadow-sm">
          <div className="flex-shrink-0 rounded-full bg-primary p-3 text-surface">
            <Leaf size={28} />
          </div>
          <div>
            <h3 className="text-md font-bold text-gray-900">Jejak Lingkungan Positif</h3>
            <p className="text-sm text-gray-700 mt-1">
              Anda telah menyelamatkan <strong className="text-primary-dark">{totalWeight} kg</strong> sampah dari TPA! Ini setara dengan mengurangi sekitar <strong>{(totalWeight * 2.5).toFixed(1)} kg emisi karbon</strong>.
            </p>
          </div>
        </section>
      </div>

      {/* Chart Section */}
      <section className="bg-surface p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Proporsi Sampah Anda</h3>
        <WastePieChart data={chartData} />
      </section>

      {/* Environmental News Section */}
      <NewsSection />
    </div>
  );
}
