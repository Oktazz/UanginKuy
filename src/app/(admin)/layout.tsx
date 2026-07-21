import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"

export default async function AdminLayout({
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

  // Check if profile is complete
  const { data: profile } = await supabase
    .from("profiles")
    .select("address, role")
    .eq("id", user.id)
    .single()

  if (!profile?.address) {
    redirect("/onboarding")
  }

  // Enforce Admin Role
  if (profile?.role !== 'admin') {
    redirect("/dashboard")
  }

  return <>{children}</>
}
