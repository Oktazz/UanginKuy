import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { User, LogOut, MapPin, Phone } from "lucide-react";

export default async function CourierProfile() {
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

  return (
    <div className="max-w-xl mx-auto pb-20">
      {/* Cover Header */}
      <div className="relative h-48 bg-gradient-to-br from-primary to-primary-dark sm:rounded-3xl shadow-md overflow-hidden flex items-center justify-center">
      </div>

      {/* Avatar & Basic Info */}
      <div className="relative px-6 -mt-20 flex flex-col items-center">
        <div className="w-36 h-36 bg-surface rounded-full p-2 shadow-xl relative z-10 group cursor-pointer transition-transform duration-300">
          <div className="w-full h-full bg-gray-100 rounded-full overflow-hidden flex items-center justify-center relative">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name || "Avatar"} className="w-full h-full object-cover" />
            ) : (
              <User size={64} className="text-gray-300" />
            )}
          </div>
        </div>

        <div className="text-center mt-5 space-y-2">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{profile?.name || "Nama Kurir"}</h2>
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold capitalize border border-primary/20">
              {profile?.role === 'kurir' ? 'Mitra Kurir' : profile?.role || "Kurir"}
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="mt-8 px-4 sm:px-0 space-y-6">
        <div className="bg-surface rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6 relative overflow-hidden group hover:shadow-md transition-all duration-500">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 transition-transform group-hover:scale-150 duration-700 pointer-events-none"></div>
          
          <h3 className="font-extrabold text-gray-900 text-lg relative flex items-center">
            Informasi Kontak
            <div className="h-1 flex-1 bg-gray-100 ml-4 rounded-full"></div>
          </h3>
          
          <div className="space-y-4 relative">
            <div className="flex items-center p-4 bg-gray-50/80 rounded-2xl border border-gray-100 hover:bg-white hover:border-primary/30 hover:shadow-sm transition-all duration-300 cursor-pointer group/item">
              <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400 group-hover/item:text-primary group-hover/item:scale-110 transition-all duration-300 flex-shrink-0">
                <Phone size={24} />
              </div>
              <div className="ml-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Nomor Telepon</p>
                <p className="font-bold text-gray-900 text-lg group-hover/item:text-primary transition-colors">
                  {profile?.phone_number || <span className="text-gray-400 font-normal italic text-base">Belum diatur</span>}
                </p>
              </div>
            </div>

            <div className="flex items-center p-4 bg-gray-50/80 rounded-2xl border border-gray-100 hover:bg-white hover:border-primary/30 hover:shadow-sm transition-all duration-300 cursor-pointer group/item">
              <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400 group-hover/item:text-primary group-hover/item:scale-110 transition-all duration-300 flex-shrink-0">
                <MapPin size={24} />
              </div>
              <div className="ml-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Area Operasional</p>
                <p className="font-bold text-gray-900 leading-snug group-hover/item:text-primary transition-colors">
                  {profile?.address || <span className="text-gray-400 font-normal italic">Belum diatur</span>}
                </p>
              </div>
            </div>
          </div>
        </div>

        <form action={handleLogout} className="pt-6">
          <button
            type="submit"
            className="w-full flex items-center justify-center space-x-2 bg-surface border-2 border-error/20 text-error font-bold p-4 rounded-2xl hover:bg-error hover:text-surface hover:border-error shadow-sm hover:shadow-xl hover:shadow-error/20 transition-all duration-300 group"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 group-hover:scale-110 transition-all duration-300" />
            <span className="tracking-wide">Logout</span>
          </button>
        </form>
      </div>
    </div>
  );
}
