"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function addSchedule(formData: FormData) {
  const supabase = await createClient(await cookies());
  const day_of_week = parseInt(formData.get("day_of_week") as string, 10);
  const cut_off_time = formData.get("cut_off_time") as string;
  const is_active = formData.get("is_active") === "true";

  const { error } = await supabase.from("schedules").insert({ day_of_week, cut_off_time, is_active });
  if (error) {
    console.error("Supabase insert error:", error);
    if (error.code === '23505') {
      throw new Error("Jadwal untuk hari tersebut sudah ada.");
    }
    throw new Error(error.message);
  }
  revalidatePath("/admin/schedules");
}

export async function updateSchedule(formData: FormData) {
  const supabase = await createClient(await cookies());
  const id = formData.get("id") as string;
  const day_of_week = parseInt(formData.get("day_of_week") as string, 10);
  const cut_off_time = formData.get("cut_off_time") as string;
  const is_active = formData.get("is_active") === "true";

  const { error } = await supabase.from("schedules").update({ day_of_week, cut_off_time, is_active }).eq("id", id);
  if (error) {
    console.error("Supabase update error:", error);
    if (error.code === '23505') {
      throw new Error("Jadwal untuk hari tersebut sudah ada.");
    }
    throw new Error(error.message);
  }
  revalidatePath("/admin/schedules");
}

export async function deleteSchedule(formData: FormData) {
  const supabase = await createClient(await cookies());
  const id = formData.get("id") as string;

  await supabase.from("schedules").delete().eq("id", id);
  revalidatePath("/admin/schedules");
}
