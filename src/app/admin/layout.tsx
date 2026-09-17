import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { AdminShell } from "./_components/AdminShell";
import { KnowledgeUploadProvider } from "./_components/KnowledgeUploadProvider";

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

  if (profile?.role !== "admin" && profile?.role !== "super_admin") {
    if (profile?.role === 'kurir') redirect('/kurir/dashboard');
    redirect("/dashboard");
  }

  return (
    <KnowledgeUploadProvider>
      <AdminShell isSuperAdmin={profile.role === "super_admin"}>
        {children}
      </AdminShell>
    </KnowledgeUploadProvider>
  );
}
