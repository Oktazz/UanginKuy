import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Wallet, Leaf, ArrowRight, ScanSearch } from "lucide-react";
import Link from "next/link";
import { WastePieChart } from "./_components/WastePieChart";
import { NewsSection } from "./_components/NewsSection";
import { OnboardingModal } from "./_components/OnboardingModal";
import { completeOnboarding } from "./actions";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default async function DashboardPage(_props?: {
  searchParams?: Promise<{ onboardingError?: string }>;
}) {
  const supabase = await createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("balance, name, account_number, onboarding_completed_at")
    .eq("id", user.id)
    .single();

  // Fetch historical transactions for pie chart
  // Join via tickets!inner to filter by client_id — explicit filter on top of RLS
  const { data: transactions } = await supabase
    .from("transaction_details")
    .select(`
      weight,
      waste_categories ( name, material_group ),
      tickets!inner ( client_id )
    `)
    .eq("tickets.client_id", user.id)
    .limit(200);

  // Group definitions for high-level waste proportion
  const materialGroupConfig: Record<string, { label: string; color: string }> = {
    plastic: { label: "Plastik", color: "#22C55E" },
    paper: { label: "Kertas", color: "#F59E0B" },
    metal: { label: "Logam", color: "#3B82F6" },
    glass: { label: "Kaca", color: "#06B6D4" },
    other: { label: "Lainnya", color: "#607D3B" },
  };

  // Aggregate data for Pie Chart by material_group
  const groupTotals: Record<string, number> = {};
  let totalWeight = 0;
  
  if (transactions) {
    transactions.forEach((tx) => {
      const wasteCategory = Array.isArray(tx.waste_categories)
        ? tx.waste_categories[0]
        : tx.waste_categories;
      const rawGroup = wasteCategory?.material_group || 'other';
      const groupKey = materialGroupConfig[rawGroup] ? rawGroup : 'other';
      const weight = Number(tx.weight) || 0;
      groupTotals[groupKey] = (groupTotals[groupKey] || 0) + weight;
      totalWeight += weight;
    });
  }

  // Build chartData sorted by highest proportion
  const chartData = Object.entries(groupTotals)
    .filter(([, value]) => value > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([groupKey, value]) => ({
      label: materialGroupConfig[groupKey]?.label || "Lainnya",
      value: Math.round(value * 100) / 100,
      color: materialGroupConfig[groupKey]?.color || "#607D3B",
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
        <Image
          src="/logo.png"
          alt="UanginKuy Logo"
          width={56}
          height={56}
          className="h-12 w-12 shrink-0 object-contain sm:h-14 sm:w-14"
          priority
        />
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
        <section id="tour-balance" className="relative h-full overflow-hidden rounded-2xl bg-primary p-6 text-surface shadow-lg">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Wallet size={80} />
          </div>
          <p className="text-sm opacity-90 font-medium">Total Saldo Aktif</p>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl">{formatter.format(profile?.balance || 0)}</h1>
          <div className="mt-6 flex items-center justify-between">
            <Link href="/withdrawal" className="bg-surface text-primary px-4 py-2 rounded-2xl text-sm font-semibold shadow hover:bg-gray-100 transition">
              Tarik Saldo
            </Link>
            <Link href="/withdrawal#riwayat-penarikan" className="text-sm flex items-center hover:underline opacity-90">
              Riwayat <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
        </section>

        {/* Impact Tracker */}
        <section className="flex h-full items-center space-x-4 rounded-2xl border border-secondary/30 bg-surface p-6 shadow-sm">
          <div className="flex-shrink-0 rounded-full bg-secondary p-3 text-white">
            <Leaf size={28} />
          </div>
          <div>
            <h3 className="text-md font-bold text-gray-900">Jejak Lingkungan Positif</h3>
            <p className="text-sm text-gray-700 mt-1">
              Anda telah menyelamatkan <strong className="text-primary-dark">{totalWeight.toFixed(2)} kg</strong> sampah dari TPA! Ini setara dengan mengurangi sekitar <strong>{(totalWeight * 2.5).toFixed(1)} kg emisi karbon</strong>.
            </p>
          </div>
        </section>
      </div>

      {/* Asisten Sortir Section */}
      <section
        id="tour-assistant"
        className="group flex flex-col gap-5 rounded-2xl border border-secondary/30 bg-surface p-6 shadow-sm transition hover:border-secondary/50 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 rounded-full bg-secondary p-3 text-white">
            <ScanSearch size={28} aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-secondary">Asisten Sortir</p>
            <h2 className="mt-1 text-lg font-extrabold text-gray-900">Bingung sampahmu masuk kategori apa?</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">Foto sampah untuk mendapat panduan memilah. Fotomu tidak disimpan.</p>
          </div>
        </div>
        <Link href="/cek-sampah" className="shrink-0">
          <span className="flex min-h-11 items-center justify-center rounded-xl bg-primary-foreground border-1 border-primary/60 px-5 text-sm font-bold text-primary shadow-sm shadow-primary/60 transition hover:bg-secondary/90">
            Cek sekarang <ArrowRight className="ml-2 transition-transform group-hover:translate-x-1 motion-reduce:transform-none" size={17} />
          </span>
        </Link>
      </section>

      {/* Chart Section */}
      <section className="bg-surface p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-800">Proporsi Jenis Sampah</h3>
          {totalWeight > 0 && (
            <span className="shrink-0 whitespace-nowrap text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              Total {totalWeight.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg
            </span>
          )}
        </div>
        <WastePieChart data={chartData} />
      </section>

      {/* Environmental News Section */}
      <NewsSection />
    </div>
  );
}
