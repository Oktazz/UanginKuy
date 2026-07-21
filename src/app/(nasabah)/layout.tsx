import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"

export default async function NasabahLayout({
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
    // If address is missing, force them to onboarding
    redirect("/onboarding")
  }

  // Redirect to their respective dashboards if they access the wrong role
  if (profile?.role === 'admin') redirect('/analytics')
  if (profile?.role === 'kurir') redirect('/route')

  return <>{children}</>
}
