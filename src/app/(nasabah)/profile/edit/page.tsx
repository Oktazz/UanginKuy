import Link from "next/link"
import { ArrowLeft, Mail, UserRound } from "lucide-react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { AvatarEditor } from "../AvatarEditor"
import { updateProfile } from "../actions"

export default async function EditProfilePage(props: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const searchParams = await props.searchParams
  const supabase = await createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, avatar_url, role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "nasabah") redirect("/dashboard")

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-4">
      <header className="flex items-center gap-3">
        <Link
          href="/profile"
          aria-label="Kembali ke profil"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-surface text-gray-600 transition hover:border-primary/30 hover:text-primary"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Edit Profil</h1>
          <p className="mt-0.5 text-sm text-gray-500">Perbarui identitas akun dan foto profil Anda.</p>
        </div>
      </header>

      {searchParams.error && (
        <p className="rounded-xl bg-error/10 p-3 text-center text-sm text-error">{searchParams.error}</p>
      )}
      {searchParams.success && (
        <p className="rounded-xl bg-primary/10 p-3 text-center text-sm text-primary">{searchParams.success}</p>
      )}

      <section className="rounded-2xl border border-gray-100 bg-surface p-5 shadow-sm sm:p-6">
        <AvatarEditor avatarUrl={profile?.avatar_url ?? null} name={profile?.name || "Pengguna Baru"} />
      </section>

      <form action={updateProfile} className="space-y-5 rounded-2xl border border-gray-100 bg-surface p-5 shadow-sm sm:p-6">
        <div>
          <label htmlFor="name" className="mb-1.5 flex items-center gap-2 text-sm font-bold text-gray-700">
            <UserRound size={16} className="text-primary" />
            Nama
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            minLength={2}
            maxLength={100}
            defaultValue={profile?.name ?? ""}
            className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 flex items-center gap-2 text-sm font-bold text-gray-700">
            <Mail size={16} className="text-primary" />
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={user.email ?? ""}
            className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-2 text-xs leading-relaxed text-gray-500">
            Perubahan email baru berlaku setelah proses konfirmasi melalui email selesai.
          </p>
        </div>

        <div className="flex justify-end border-t border-gray-100 pt-5">
          <button type="submit" className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-md shadow-primary/20 transition hover:bg-primary-dark">
            Simpan Perubahan
          </button>
        </div>
      </form>
    </div>
  )
}
