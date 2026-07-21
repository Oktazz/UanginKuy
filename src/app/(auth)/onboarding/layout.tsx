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

  // Check if user has already completed onboarding
  // Assuming 'address' is required during onboarding, we can check if it exists
  const { data: profile } = await supabase
    .from("profiles")
    .select("address")
    .eq("id", user.id)
    .single()

  if (profile?.address) {
    // If address is already filled, they don't need onboarding
    redirect("/dashboard")
  }

  return <>{children}</>
}
