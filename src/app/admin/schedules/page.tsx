import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { cookies } from "next/headers";
import ScheduleClient from "./_components/ScheduleClient";
import type { WarehouseOperatingHoursInput } from "./actions";

export default async function SchedulesPage() {
  const supabase = await createClient(await cookies());

  const { data: schedules } = await supabase
    .from("schedules")
    .select("*")
    .order("day_of_week", { ascending: true });

  const admin = createAdminClient();
  const { data: hoursSetting } = await admin
    .from("app_settings")
    .select("value")
    .eq("key", "warehouse_operating_hours")
    .maybeSingle();

  const operatingHours = (hoursSetting?.value as unknown as WarehouseOperatingHoursInput) || null;

  return (
    <div className="animate-in fade-in duration-500">
      <ScheduleClient
        schedules={schedules || []}
        initialOperatingHours={operatingHours}
      />
    </div>
  );
}
