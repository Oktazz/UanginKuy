import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import WarehouseClient from "./_components/WarehouseClient";

export default async function WarehouseSettingsPage() {
  const supabase = await createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") redirect("/admin/dashboard");

  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "warehouse_location")
    .maybeSingle();

  const val = (data?.value as Record<string, unknown> | null) || null;

  const initialData = {
    latitude: typeof val?.latitude === "number" ? val.latitude : null,
    longitude: typeof val?.longitude === "number" ? val.longitude : null,
    name: typeof val?.name === "string" ? val.name : "Gudang & Depo Utama UanginKuy",
    address:
      typeof val?.address === "string"
        ? val.address
        : "Gudang Utama UanginKuy, Kawasan Daur Ulang Mandiri",
    phone: typeof val?.phone === "string" ? val.phone : "",
  };

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      <WarehouseClient initialData={initialData} />
    </div>
  );
}
