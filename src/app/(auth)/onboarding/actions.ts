"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createAdminClient } from "@/utils/supabase/admin"
import { createClient } from "@/utils/supabase/server"

export async function completeOnboarding() {
  const supabase = await createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "nasabah") redirect("/dashboard")

  const admin = createAdminClient()
  const { error } = await admin
    .from("profiles")
    .update({
      onboarding_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .eq("role", "nasabah")

  if (error) redirect(`/onboarding?error=${encodeURIComponent("Gagal menyimpan status onboarding.")}`)

  revalidatePath("/", "layout")
  redirect("/dashboard")
}
