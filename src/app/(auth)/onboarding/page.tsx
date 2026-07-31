import { BookOpen, Leaf, MapPin, TicketCheck, WalletCards } from "lucide-react"
import { completeOnboarding } from "./actions"

const FEATURES = [
  {
    icon: MapPin,
    title: "Simpan beberapa alamat",
    description: "Tambahkan lokasi penjemputan saat Anda membuat booking pertama.",
  },
  {
    icon: TicketCheck,
    title: "Pantau tiket",
    description: "Lihat jadwal dan perkembangan penjemputan dari satu tempat.",
  },
  {
    icon: WalletCards,
    title: "Kelola hasil penjualan",
    description: "Saldo dari sampah yang selesai ditimbang akan tercatat otomatis.",
  },
]

export default async function OnboardingPage(props: {
  searchParams: Promise<{ error?: string }>
}) {
  const searchParams = await props.searchParams

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-3xl overflow-hidden rounded-3xl border border-gray-100 bg-surface shadow-sm">
        <div className="bg-primary px-6 py-9 text-center text-white sm:px-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <Leaf size={30} />
          </div>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight">Selamat datang di UanginKuy</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-white/85 sm:text-base">
            Ubah sampah terpilah menjadi nilai tanpa repot datang ke bank sampah.
          </p>
        </div>

        <div className="space-y-7 p-6 sm:p-10">
          <div className="grid gap-4 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon size={20} />
                </div>
                <h2 className="mt-4 text-sm font-bold text-gray-900">{title}</h2>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">{description}</p>
              </article>
            ))}
          </div>

          <div className="flex items-start gap-3 rounded-2xl bg-secondary/40 p-4 text-sm text-gray-700">
            <BookOpen className="mt-0.5 shrink-0 text-primary" size={18} />
            <p>Alamat dan nomor penerima baru akan diminta saat diperlukan untuk penjemputan.</p>
          </div>

          {searchParams.error && (
            <p className="rounded-xl bg-error/10 p-3 text-center text-sm text-error">{searchParams.error}</p>
          )}

          <form action={completeOnboarding} className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="submit"
              className="rounded-xl px-5 py-3 text-sm font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            >
              Lewati
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-md shadow-primary/20 transition hover:bg-primary-dark"
            >
              Mulai Sekarang
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
