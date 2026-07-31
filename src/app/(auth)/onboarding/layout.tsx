import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_completed_at")
    .eq("id", user.id)
    .single()

  if (profile?.role === "admin" || profile?.role === "super_admin") redirect("/admin/dashboard")
  if (profile?.role === "kurir") redirect("/kurir/dashboard")
  if (profile?.onboarding_completed_at) redirect("/dashboard")

  return <>{children}</>
}
