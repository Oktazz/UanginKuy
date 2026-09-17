import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/auth/authorization";
import CounterClient from "./_components/CounterClient";

export default async function AdminCounterPage() {
  await requireAdmin();
  const supabase = await createClient(await cookies());

  const [{ data: categories }, { data: warehouseSetting }] = await Promise.all([
    supabase
      .from("waste_categories")
      .select("id, name, material_group, price_per_kg, carbon_factor")
      .order("name", { ascending: true }),
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "warehouse_location")
      .maybeSingle(),
  ]);

  const val = (warehouseSetting?.value as Record<string, unknown> | null) || null;
  const warehouse = {
    name: typeof val?.name === "string" && val.name.trim() ? val.name : undefined,
    address: typeof val?.address === "string" && val.address.trim() ? val.address : undefined,
    phone: typeof val?.phone === "string" && val.phone.trim() ? val.phone : undefined,
  };

  return (
    <div className="animate-in fade-in duration-500">
      <CounterClient categories={categories || []} warehouse={warehouse} />
    </div>
  );
}
