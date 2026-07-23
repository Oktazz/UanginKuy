import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import ScheduleClient from "./ScheduleClient";

export default async function SchedulesPage() {
  const supabase = await createClient(await cookies());

  const { data: schedules } = await supabase
    .from("schedules")
    .select("*")
    .order("operational_date", { ascending: false });

  return (
    <div className="animate-in fade-in duration-500">
      <ScheduleClient schedules={schedules || []} />
    </div>
  );
}
