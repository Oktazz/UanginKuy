import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { ClientNav } from "@/components/ui/ClientNav"
import { AiChatWidget } from "@/components/ai-chat/AiChatWidget"
import { ToastProvider } from "@/components/ui/ToastProvider"

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  // Redirect to their respective dashboards if they access the wrong role
  if (profile?.role === 'admin' || profile?.role === 'super_admin') redirect('/admin/dashboard')
  if (profile?.role === 'kurir') redirect('/kurir/dashboard')

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background">
        <ClientNav />
        <main className="px-4 pb-24 pt-6 sm:px-6 md:pt-8 xl:pb-8 xl:pl-72 xl:pr-8">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>

        {/* UanginBot — Floating AI Chat Assistant */}
        <AiChatWidget />
      </div>
    </ToastProvider>
  )
}
