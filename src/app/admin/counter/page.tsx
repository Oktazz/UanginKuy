import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/auth/authorization";
import CounterClient from "./_components/CounterClient";

export default async function AdminCounterPage() {
  await requireAdmin();
  const supabase = await createClient(await cookies());

  const { data: categories } = await supabase
    .from("waste_categories")
    .select("id, name, material_group, price_per_kg, carbon_factor")
    .order("name", { ascending: true });

  return (
    <div className="animate-in fade-in duration-500">
      <CounterClient categories={categories || []} />
    </div>
  );
}
