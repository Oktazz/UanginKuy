import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Bot,
  CalendarCheck2,
  Camera,
  Check,
  ChevronRight,
  CircleDollarSign,
  Leaf,
  MapPin,
  PackageCheck,
  QrCode,
  Recycle,
  Route,
  Scale,
  ScanLine,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";

import Hero from "@/components/ui/hero-button-expendable";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "UanginKuy | Sampah Dijemput, Saldo Bertambah",
  description:
    "Jadwalkan penjemputan sampah dari rumah, pantau penimbangan transparan, dan kelola saldo daur ulang bersama UanginKuy.",
};

const benefits = [
  {
    icon: MapPin,
    title: "Tak perlu antar sendiri",
    description: "Pilih jadwal penjemputan, lalu kurir datang ke alamatmu.",
  },
  {
    icon: Scale,
    title: "Timbang transparan",
    description: "Berat dan nilai sampah tercatat saat proses penjemputan.",
  },
  {
    icon: Leaf,
    title: "Dampakmu tercatat",
    description: "Lihat total sampah dan dampak lingkungan dari kebiasaan baikmu.",
  },
];

const steps = [
  {
    icon: Recycle,
    title: "Pilah sampah",
    description: "Pisahkan material yang bisa didaur ulang di rumah.",
  },
  {
    icon: CalendarCheck2,
    title: "Pilih jadwal",
    description: "Tentukan hari penjemputan yang tersedia di aplikasi.",
  },
  {
    icon: PackageCheck,
    title: "Serahkan & timbang",
    description: "Kurir menjemput dan menimbang setiap kategori sampah.",
  },
  {
    icon: WalletCards,
    title: "Terima saldo",
    description: "Nilai hasil timbang otomatis masuk ke saldo UanginKuy.",
  },
];

const faqs = [
  {
    question: "Bagaimana sampah saya dijemput?",
    answer:
      "Setelah membuat akun, pilih jadwal operasional dan alamat penjemputan. Kamu akan menerima tiket digital untuk ditunjukkan saat kurir tiba.",
  },
  {
    question: "Jenis sampah apa yang bisa disetor?",
    answer:
      "Kategori yang diterima mengikuti daftar aktif dari pengelola bank sampah. Jenis material dan harga per kilogram selalu ditampilkan di aplikasi.",
  },
  {
    question: "Bagaimana nilai sampah dihitung?",
    answer:
      "Kurir menimbang sampah per kategori dengan timbangan digital. Sistem mengalikan berat dengan harga aktif sehingga hasilnya dapat kamu periksa.",
  },
  {
    question: "Apakah saldo bisa dicairkan?",
    answer:
      "Ya. Saldo yang memenuhi ketentuan penarikan dapat diajukan ke rekening bank atau dompet digital yang tersedia di aplikasi.",
  },
];

export default async function Page() {
  const supabase = await createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <a
        href="#konten-utama"
        className="sr-only z-[60] rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Lewati ke konten utama
      </a>

      <header className="sticky top-0 z-50 border-b border-primary/10 bg-background/90 backdrop-blur-xl">
        <nav
          aria-label="Navigasi utama"
          className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8"
        >
          <Link
            href="/"
            aria-label="UanginKuy, halaman utama"
            className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Leaf className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-extrabold tracking-tight">
              Uangin<span className="text-primary">Kuy</span>
            </span>
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            <NavLink href="#fitur">Fitur</NavLink>
            <NavLink href="#cara-kerja">Cara Kerja</NavLink>
            <NavLink href="#faq">FAQ</NavLink>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/login"
              className="inline-flex min-h-11 cursor-pointer items-center rounded-lg px-3 text-sm font-bold text-primary outline-none transition-colors duration-200 hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              aria-label="Daftar Sekarang"
              className="inline-flex min-h-11 cursor-pointer items-center rounded-lg bg-primary px-2.5 text-xs font-bold text-primary-foreground outline-none transition-colors duration-200 hover:bg-primary-dark focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:px-4 sm:text-sm"
            >
              <span className="sm:hidden">Daftar</span>
              <span className="hidden sm:inline">Daftar Sekarang</span>
            </Link>
          </div>
        </nav>
      </header>

      <main id="konten-utama">
        <section className="relative isolate">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
            <div className="absolute -right-28 -top-24 h-80 w-80 rounded-full bg-secondary/70 blur-3xl" />
            <div className="absolute -left-24 top-72 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
            <svg className="absolute inset-x-0 bottom-0 h-32 w-full text-primary/[0.04]" viewBox="0 0 1200 160" preserveAspectRatio="none">
              <path fill="currentColor" d="M0 112C185 38 354 150 552 80c216-76 420 41 648-50v130H0Z" />
            </svg>
          </div>

          <div className="mx-auto grid min-h-0 min-w-0 max-w-7xl items-center gap-8 px-4 py-12 sm:gap-12 sm:px-6 sm:py-20 lg:min-h-[calc(100svh-4rem)] lg:grid-cols-[1.02fr_.98fr] lg:px-8 lg:py-24">
            <div className="min-w-0 max-w-2xl">
              <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-primary/15 bg-surface/80 px-3 py-2 text-[10px] font-bold uppercase leading-4 tracking-[0.12em] text-primary shadow-sm sm:mb-6 sm:text-sm sm:tracking-[0.14em]">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Bank sampah digital, langsung dari rumah
              </div>
              <h1 className="text-[2.25rem] font-extrabold leading-[1.08] tracking-[-0.04em] text-foreground sm:text-5xl lg:text-6xl">
                Sampah rumahmu dijemput. <span className="text-primary">Nilainya masuk saldo.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:mt-6 sm:text-lg sm:leading-8">
                Pilah sampah, pilih jadwal, lalu pantau penjemputan dan hasil timbang dalam satu aplikasi.
              </p>
              <div className="mt-7 flex flex-col items-stretch gap-2.5 sm:mt-8 sm:flex-row sm:items-center sm:gap-3">
                <Hero />
                <Link
                  href="/login"
                  className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl px-5 font-bold text-primary outline-none transition-colors duration-200 hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Masuk ke akun
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
              <div className="mt-7 flex flex-col items-start gap-3 text-sm font-medium text-muted-foreground sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-x-5">
                <TrustItem>Pendaftaran ringkas</TrustItem>
                <TrustItem>Hasil timbang tercatat</TrustItem>
                <TrustItem>Jadwal mudah dipantau</TrustItem>
              </div>
            </div>

            <ProductPreview />
          </div>
        </section>

        <section className="bg-surface py-14 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Lebih mudah, lebih jelas"
              title="Menabung sampah tidak harus merepotkan"
              description="UanginKuy menghubungkan rumahmu dengan proses penjemputan, penimbangan, dan pencatatan nilai dalam satu alur."
            />
            <div className="mt-8 grid gap-4 sm:mt-10 md:grid-cols-3">
              {benefits.map((benefit) => (
                <article key={benefit.title} className="rounded-2xl border border-border bg-background/55 p-5 sm:p-6">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <benefit.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold">{benefit.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{benefit.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="cara-kerja" className="scroll-mt-20 py-14 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Cara kerja"
              title="Dari rumah ke saldo dalam empat langkah"
              description="Prosesnya dirancang agar kamu selalu tahu apa yang terjadi pada sampahmu."
            />
            <ol className="relative mt-8 grid gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <li key={step.title} className="relative rounded-2xl border border-primary/10 bg-surface p-6 shadow-sm">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                      <step.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <span className="text-3xl font-black text-primary/15">0{index + 1}</span>
                  </div>
                  <h3 className="text-lg font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="fitur" className="scroll-mt-20 bg-primary py-14 text-primary-foreground sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              inverse
              eyebrow="Satu aplikasi"
              title="Semua yang kamu butuhkan untuk mulai mendaur ulang"
              description="Teknologi bekerja di belakang layar. Kamu cukup memilah, menjadwalkan, dan memantau."
            />
            <div className="mt-8 grid gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-6">
              <FeatureCard className="lg:col-span-4" icon={Camera} title="Kenali nilai sampah sebelum dijemput">
                Unggah foto untuk mendapatkan estimasi kategori dan nilai awal, lalu lanjutkan pemesanan saat kamu siap.
              </FeatureCard>
              <FeatureCard className="lg:col-span-2" icon={QrCode} title="Tiket QR siap dipindai">
                Setiap penjemputan memiliki tiket digital yang menghubungkan sampahmu dengan proses timbang.
              </FeatureCard>
              <FeatureCard className="lg:col-span-2" icon={Route} title="Status mudah dipantau">
                Periksa jadwal dan perkembangan penjemputan tanpa menebak-nebak.
              </FeatureCard>
              <FeatureCard className="lg:col-span-4" icon={Bot} title="Ada UanginBot saat kamu perlu bantuan">
                Tanyakan cara memakai aplikasi, kategori sampah, saldo, atau status penjemputan langsung dari dashboard.
              </FeatureCard>
            </div>
          </div>
        </section>

        <section className="bg-surface py-14 sm:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 sm:gap-10 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary">Satu ekosistem</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Rumah, kurir, dan bank sampah bekerja dalam alur yang sama
              </h2>
              <p className="mt-5 max-w-xl leading-7 text-muted-foreground">
                Jadwal tersusun, rute penjemputan lebih jelas, dan hasil timbang langsung terhubung ke akunmu.
              </p>
              <ul className="mt-7 space-y-4">
                <EcosystemItem icon={CalendarCheck2}>Jadwal operasional yang selalu diperbarui</EcosystemItem>
                <EcosystemItem icon={Route}>Rute kurir disusun untuk penjemputan harian</EcosystemItem>
                <EcosystemItem icon={Scale}>Timbangan digital mengurangi pencatatan manual</EcosystemItem>
              </ul>
            </div>
            <div className="relative mx-auto w-full max-w-xl rounded-2xl border border-primary/10 bg-background p-4 shadow-[0_24px_70px_rgba(31,41,55,0.08)] sm:rounded-3xl sm:p-8">
              <div className="absolute -right-3 -top-3 h-24 w-24 rounded-full bg-secondary/70 blur-2xl" aria-hidden="true" />
              <div className="relative grid gap-3 sm:grid-cols-3">
                <JourneyNode icon={MapPin} label="Rumahmu" detail="Permintaan dibuat" />
                <JourneyNode icon={Route} label="Kurir" detail="Penjemputan aktif" />
                <JourneyNode icon={ScanLine} label="Bank sampah" detail="Nilai tercatat" />
              </div>
              <div className="relative mt-5 flex items-center gap-3 rounded-2xl bg-primary p-4 text-primary-foreground">
                <ShieldCheck className="h-6 w-6 shrink-0" aria-hidden="true" />
                <p className="text-sm font-semibold">Setiap tahap tersambung ke satu tiket penjemputan.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="scroll-mt-20 py-14 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <SectionHeading
              centered
              eyebrow="FAQ"
              title="Pertanyaan yang sering ditanyakan"
              description="Jawaban singkat sebelum kamu mulai menabung sampah bersama UanginKuy."
            />
            <div className="mt-8 space-y-3 sm:mt-10">
              {faqs.map((faq) => (
                <details key={faq.question} className="group rounded-2xl border border-border bg-surface p-5 open:border-primary/25 open:shadow-sm">
                  <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-4 font-bold outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
                    {faq.question}
                    <ChevronRight className="h-5 w-5 shrink-0 text-primary transition-transform duration-200 group-open:rotate-90 motion-reduce:transition-none" aria-hidden="true" />
                  </summary>
                  <p className="mt-3 pr-8 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-14 sm:px-6 sm:pb-24 lg:px-8">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl bg-primary-dark px-5 py-10 text-center text-primary-foreground sm:rounded-3xl sm:px-12 sm:py-16">
            <div className="absolute -left-16 -top-24 h-64 w-64 rounded-full border-[42px] border-white/5" aria-hidden="true" />
            <div className="absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-secondary/10" aria-hidden="true" />
            <div className="relative mx-auto max-w-2xl">
              <Leaf className="mx-auto h-9 w-9 text-secondary" aria-hidden="true" />
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">Siap mengubah sampah jadi nilai?</h2>
              <p className="mt-4 text-sm leading-6 text-white/75 sm:text-base">
                Buat akun, pilih jadwal pertamamu, dan biarkan UanginKuy membantu proses berikutnya.
              </p>
              <div className="mt-8 flex justify-center">
                <Hero className="bg-secondary text-primary-dark shadow-none hover:bg-white focus-visible:ring-secondary focus-visible:ring-offset-primary-dark" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-primary/10 bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 px-4 py-8 text-center sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-left lg:px-8">
          <div className="flex items-center gap-2 font-extrabold">
            <Leaf className="h-5 w-5 text-primary" aria-hidden="true" />
            UanginKuy
          </div>
          <p className="text-sm text-muted-foreground">Bank sampah digital, langsung dari rumah.</p>
          <div className="flex items-center gap-4 text-sm font-semibold">
            <Link className="cursor-pointer rounded-sm text-muted-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-primary" href="/login">Masuk</Link>
            <Link className="cursor-pointer rounded-sm text-primary outline-none hover:text-primary-dark focus-visible:ring-2 focus-visible:ring-primary" href="/register">Daftar Sekarang</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-muted-foreground outline-none transition-colors duration-200 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary">
      {children}
    </a>
  );
}

function TrustItem({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
      </span>
      {children}
    </span>
  );
}

function ProductPreview() {
  return (
    <div className="relative mx-auto min-w-0 w-full max-w-full lg:max-w-[34rem] lg:justify-self-end" aria-label="Contoh tampilan dashboard UanginKuy">
      <div className="absolute -inset-3 rotate-2 rounded-[2rem] bg-secondary/60" aria-hidden="true" />
      <div className="relative min-w-0 overflow-hidden rounded-[1.75rem] border border-primary/10 bg-surface p-4 shadow-[0_28px_80px_rgba(31,41,55,0.16)] sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground">Contoh tampilan</p>
            <p className="mt-1 truncate font-extrabold">Halo, Sahabat Hijau</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Leaf className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground">
          <div className="absolute -right-7 -top-8 h-28 w-28 rounded-full border-[20px] border-white/10" aria-hidden="true" />
          <div className="relative flex min-w-0 items-start justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium text-white/70">Saldo sampah</p>
              <p className="mt-2 text-[clamp(1.35rem,6vw,1.5rem)] font-extrabold leading-tight">Siap bertambah</p>
              <p className="mt-1 text-xs text-white/70">setelah penimbangan selesai</p>
            </div>
            <CircleDollarSign className="h-8 w-8 shrink-0 text-secondary" aria-hidden="true" />
          </div>
        </div>

        <div className="mt-4 grid min-w-0 grid-cols-2 gap-2 sm:gap-3">
          <div className="min-w-0 rounded-xl border border-border bg-background/60 p-3 sm:p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Recycle className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="mt-3 break-words text-xs text-muted-foreground">Sampah terkumpul</p>
            <p className="mt-1 break-words text-sm font-bold">Dampak terus tercatat</p>
          </div>
          <div className="min-w-0 rounded-xl border border-border bg-background/60 p-3 sm:p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary-dark">
              <Banknote className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="mt-3 break-words text-xs text-muted-foreground">Nilai transparan</p>
            <p className="mt-1 break-words text-sm font-bold">Sesuai hasil timbang</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <CalendarCheck2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-bold">Penjemputan berikutnya</p>
              <span className="rounded-full bg-secondary px-2 py-1 text-[10px] font-bold text-primary-dark">Terjadwal</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Alamat dan jadwal tampil di satu tempat</p>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-5 -left-2 hidden items-center gap-3 rounded-2xl border border-primary/10 bg-surface p-3 shadow-xl sm:flex">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary-dark">
          <Scale className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Timbangan digital</p>
          <p className="text-sm font-bold">Berat tersinkron</p>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  inverse = false,
  centered = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  inverse?: boolean;
  centered?: boolean;
}) {
  return (
    <div className={centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className={`text-sm font-bold uppercase tracking-[0.16em] ${inverse ? "text-secondary" : "text-primary"}`}>{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
      <p className={`mt-4 leading-7 ${inverse ? "text-white/75" : "text-muted-foreground"}`}>{description}</p>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, children, className }: { icon: typeof Leaf; title: string; children: React.ReactNode; className?: string }) {
  return (
    <article className={`rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur-sm ${className ?? ""}`}>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary-dark">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="mt-5 text-xl font-bold">{title}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">{children}</p>
    </article>
  );
}

function EcosystemItem({ icon: Icon, children }: { icon: typeof Leaf; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 text-sm font-semibold">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      {children}
    </li>
  );
}

function JourneyNode({ icon: Icon, label, detail }: { icon: typeof Leaf; label: string; detail: string }) {
  return (
    <div className="relative rounded-2xl border border-primary/10 bg-surface p-4 text-center shadow-sm">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="mt-3 text-sm font-bold">{label}</p>
      <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{detail}</p>
    </div>
  );
}
