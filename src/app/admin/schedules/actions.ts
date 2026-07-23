"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function addSchedule(formData: FormData) {
  const supabase = await createClient(await cookies());
  const operational_date = formData.get("operational_date") as string;
  const cut_off_time = formData.get("cut_off_time") as string;
  const is_active = formData.get("is_active") === "true";

  await supabase.from("schedules").insert({ operational_date, cut_off_time, is_active });
  revalidatePath("/admin/schedules");
}

export async function updateSchedule(formData: FormData) {
  const supabase = await createClient(await cookies());
  const id = formData.get("id") as string;
  const operational_date = formData.get("operational_date") as string;
  const cut_off_time = formData.get("cut_off_time") as string;
  const is_active = formData.get("is_active") === "true";

  await supabase.from("schedules").update({ operational_date, cut_off_time, is_active }).eq("id", id);
  revalidatePath("/admin/schedules");
}

export async function deleteSchedule(formData: FormData) {
  const supabase = await createClient(await cookies());
  const id = formData.get("id") as string;

  await supabase.from("schedules").delete().eq("id", id);
  revalidatePath("/admin/schedules");
}
