import { redirect } from "next/navigation";
import { ShieldCheck, UserCog, UsersRound } from "lucide-react";
import { getAuthenticatedProfile } from "@/lib/auth/authorization";
import { createAdminClient } from "@/utils/supabase/admin";
import { InviteStaffForm } from "./InviteStaffForm";

const roleLabels = {
  kurir: "Kurir",
  admin: "Admin",
  super_admin: "Super Admin",
} as const;

const roleStyles = {
  kurir: "bg-blue-50 text-blue-700",
  admin: "bg-primary/10 text-primary",
  super_admin: "bg-purple-50 text-purple-700",
} as const;

export default async function AdminUsersPage() {
  const { user, profile } = await getAuthenticatedProfile();

  if (!user) redirect("/login");
  if (profile?.role !== "super_admin") redirect("/admin/dashboard");

  const admin = createAdminClient();
  const [{ data: profiles }, { data: authData, error: authError }] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id, name, role, created_at")
        .in("role", ["kurir", "admin", "super_admin"])
        .order("created_at", { ascending: false }),
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);

  if (authError) {
    throw new Error(`Gagal memuat akun staf: ${authError.message}`);
  }

  const authUsersById = new Map(
    authData.users.map((authUser) => [authUser.id, authUser]),
  );
  const staff = (profiles ?? []).map((staffProfile) => ({
    ...staffProfile,
    authUser: authUsersById.get(staffProfile.id),
  }));

  return (
    <div className="space-y-8">
      <header className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
          <ShieldCheck size={28} aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Manajemen Pengguna
          </h1>
          <p className="mt-2 font-medium text-gray-500">
            Undang admin dan kurir melalui akses khusus super admin.
          </p>
        </div>
      </header>

      <div className="grid gap-8 xl:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.65fr)]">
        <InviteStaffForm />

        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-surface shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 lg:px-8">
            <div className="flex items-center gap-3">
              <UsersRound className="text-primary" size={22} aria-hidden="true" />
              <h2 className="text-lg font-extrabold text-gray-900">
                Akun Staf
              </h2>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-extrabold text-gray-600">
              {staff.length} akun
            </span>
          </div>

          {staff.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <UserCog
                size={40}
                className="mx-auto text-gray-300"
                aria-hidden="true"
              />
              <p className="mt-4 font-bold text-gray-700">
                Belum ada akun staf
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left">
                <thead className="bg-gray-50/70 text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-6 py-4 font-extrabold lg:px-8">Pengguna</th>
                    <th className="px-6 py-4 font-extrabold">Role</th>
                    <th className="px-6 py-4 font-extrabold">Status</th>
                    <th className="px-6 py-4 font-extrabold">Dibuat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {staff.map((staffUser) => {
                    const role =
                      staffUser.role as keyof typeof roleLabels;
                    const isConfirmed = Boolean(
                      staffUser.authUser?.email_confirmed_at,
                    );

                    return (
                      <tr key={staffUser.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 lg:px-8">
                          <p className="font-bold text-gray-900">
                            {staffUser.name}
                          </p>
                          <p className="mt-0.5 text-sm text-gray-500">
                            {staffUser.authUser?.email ?? "Email tidak tersedia"}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${
                              roleStyles[role] ?? "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {roleLabels[role] ?? staffUser.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-sm font-bold ${
                              isConfirmed ? "text-success" : "text-warning"
                            }`}
                          >
                            {isConfirmed ? "Aktif" : "Menunggu aktivasi"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-500">
                          {staffUser.created_at
                            ? new Date(staffUser.created_at).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
