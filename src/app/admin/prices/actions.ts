"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function addCategory(formData: FormData) {
  const supabase = await createClient(await cookies());
  const name = formData.get("name") as string;
  const price_per_kg = parseFloat(formData.get("price_per_kg") as string);
  const carbon_factor = parseFloat(formData.get("carbon_factor") as string);

  await supabase.from("waste_categories").insert({ name, price_per_kg, carbon_factor });
  revalidatePath("/admin/prices");
}

export async function updateCategory(formData: FormData) {
  const supabase = await createClient(await cookies());
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const price_per_kg = parseFloat(formData.get("price_per_kg") as string);
  const carbon_factor = parseFloat(formData.get("carbon_factor") as string);

  await supabase.from("waste_categories").update({ name, price_per_kg, carbon_factor }).eq("id", id);
  revalidatePath("/admin/prices");
}

export async function deleteCategory(formData: FormData) {
  const supabase = await createClient(await cookies());
  const id = formData.get("id") as string;

  await supabase.from("waste_categories").delete().eq("id", id);
  revalidatePath("/admin/prices");
}
