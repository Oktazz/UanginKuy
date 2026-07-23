import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { User, LogOut, Phone, ChevronRight, BookOpen, Shield } from "lucide-react";
import Link from "next/link";

export default async function ProfilePage() {
  const supabase = await createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const handleLogout = async () => {
    "use server";
    const supabaseAction = await createClient(await cookies());
    await supabaseAction.auth.signOut();
    redirect("/login");
  };

  const initials = profile?.name
    ? profile.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "UK";

  return (
    <div className="space-y-6 pb-4">
      {/* Page Header — konsisten dgn halaman lain */}
      <header>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Profil Saya</h2>
        <p className="text-sm text-gray-500 mt-1">Kelola informasi akun Anda.</p>
      </header>

      {/* Avatar + Identity Card */}
      <div className="bg-surface rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center space-x-4">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.name || "Avatar"}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-white text-xl font-extrabold">{initials}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-gray-900 leading-tight truncate">
            {profile?.name || "Pengguna Baru"}
          </p>
          <p className="text-sm text-gray-500 mt-0.5 truncate">{user.email}</p>
          <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider border border-primary/20">
            {profile?.role || "Nasabah"}
          </span>
        </div>
      </div>

      {/* Info Akun */}
      <div className="bg-surface rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Informasi Akun</p>
        </div>

        <div className="flex items-center px-4 py-4 space-x-3 group hover:bg-gray-50/80 transition-colors duration-200">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Phone size={18} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nomor Telepon</p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">
              {profile?.phone_number || (
                <span className="text-gray-400 font-normal italic">Belum diatur</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center px-4 py-4 space-x-3 group hover:bg-gray-50/80 transition-colors duration-200 border-t border-gray-100/60">
          <div className="w-10 h-10 bg-info/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield size={18} className="text-info" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email</p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5 truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Pengaturan */}
      <div className="bg-surface rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pengaturan</p>
        </div>

        <Link
          href="/profile/addresses"
          className="flex items-center px-4 py-4 space-x-3 hover:bg-gray-50/80 transition-colors duration-200 group"
        >
          <div className="w-10 h-10 bg-secondary/60 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-secondary transition-colors duration-200">
            <BookOpen size={18} className="text-primary-dark" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Buku Alamat</p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">Kelola alamat penjemputan</p>
          </div>
          <ChevronRight size={16} className="text-gray-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0" />
        </Link>
      </div>

      {/* Logout */}
      <form action={handleLogout}>
        <button
          type="submit"
          className="w-full flex items-center justify-center space-x-2 bg-surface border border-error/30 text-error font-bold py-3.5 px-4 rounded-2xl hover:bg-error hover:text-white hover:border-error hover:shadow-lg hover:shadow-error/20 transition-all duration-300 group cursor-pointer"
        >
          <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform duration-200" />
          <span className="text-sm tracking-wide">Keluar dari Akun</span>
        </button>
      </form>
    </div>
  );
}
