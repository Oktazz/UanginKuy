import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { CourierNav } from "@/components/ui/CourierNav"

export default async function KurirLayout({
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

  // Enforce Kurir Role
  if (profile?.role !== 'kurir') {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      <CourierNav />
      <main className="pb-24 md:pb-8 md:pl-64 pt-8 px-4 md:px-8 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  )
}
