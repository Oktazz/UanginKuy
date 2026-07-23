import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { AdminSidebar } from "@/components/ui/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    if (profile?.role === 'kurir') redirect('/kurir/dashboard');
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background flex font-sans text-gray-900">
      <AdminSidebar />
      <main className="flex-1 ml-72 h-screen overflow-y-auto">
        <div className="p-10 lg:p-12 max-w-[1600px] mx-auto min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
