import Image from "next/image";
import {
  Leaf,
  Recycle,
  ShieldCheck,
  Sparkles,
  Truck,
  UserRoundCheck,
  WalletCards,
} from "lucide-react";

interface AuthVisualPanelProps {
  variant: "login" | "register";
}

const panelCopy = {
  login: {
    badge: "Ekosistem bank sampah digital",
    title: "Ubah kebiasaan kecil menjadi dampak yang berarti.",
    description:
      "Atur penjemputan, pantau proses, dan lihat nilai sampahmu tumbuh dalam satu tempat.",
    cardTitle: "Nilai sampahmu",
    cardValue: "Terpantau",
    secondaryTitle: "Penjemputan mudah",
    secondaryText: "Dari rumah ke bank sampah",
    footer: "Bersama membangun kebiasaan yang lebih berkelanjutan.",
  },
  register: {
    badge: "Mulai dari langkah pertama",
    title: "Sampah di rumah bisa menjadi awal yang lebih baik.",
    description:
      "Buat akun nasabah, pilih jadwal penjemputan, dan ikuti setiap prosesnya dengan jelas.",
    cardTitle: "Akun nasabah",
    cardValue: "Siap dimulai",
    secondaryTitle: "Dijemput dari rumah",
    secondaryText: "Jadwal sesuai ketersediaan",
    footer: "Satu akun untuk penjemputan, saldo, dan dampakmu.",
  },
} as const;

export function AuthVisualPanel({ variant }: AuthVisualPanelProps) {
  const copy = panelCopy[variant];
  const SecondaryIcon = variant === "login" ? Truck : UserRoundCheck;

  return (
    <aside
      data-auth-aside={variant}
      className="relative hidden min-h-svh overflow-hidden bg-primary-dark p-8 text-white lg:flex lg:flex-col lg:justify-between xl:p-12"
    >
      <div className="pointer-events-none absolute -right-36 -top-36 size-[28rem] rounded-full border border-white/10 bg-white/[0.06]" />
      <div className="pointer-events-none absolute -bottom-40 -left-28 size-[30rem] rounded-full border border-secondary/20 bg-secondary/10" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_68%_38%,rgba(231,225,177,0.18),transparent_30%)]" />

      <div className="relative z-10 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-white p-1.5 shadow-lg">
          <Image
            src="/logo.png"
            alt="UanginKuy Logo"
            width={32}
            height={32}
            className="size-8 object-contain"
            priority
          />
        </div>
        <div>
          <p className="text-lg font-extrabold tracking-tight">UanginKuy</p>
          <p className="text-xs font-medium text-white/65">
            Sampah bernilai, bumi terjaga
          </p>
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-xl">
        <div className="mb-9 max-w-lg">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-secondary backdrop-blur-sm">
            {variant === "login" ? (
              <Recycle className="size-3.5" aria-hidden="true" />
            ) : (
              <Sparkles className="size-3.5" aria-hidden="true" />
            )}
            {copy.badge}
          </p>
          <h2 className="text-4xl font-bold leading-tight tracking-[-0.035em] xl:text-5xl">
            {copy.title}
          </h2>
          <p className="mt-4 max-w-md text-base leading-7 text-white/70">
            {copy.description}
          </p>
        </div>

        <div className="relative h-64">
          <div
            data-auth-card="primary"
            className="absolute left-0 top-5 w-64 rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-xl"
          >
            <div className="mb-7 flex items-center justify-between">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-secondary text-primary-dark">
                <WalletCards className="size-5" aria-hidden="true" />
              </span>
              <span className="rounded-full bg-success/20 px-2.5 py-1 text-[11px] font-bold text-green-200">
                Aktif
              </span>
            </div>
            <p className="text-xs font-medium text-white/60">{copy.cardTitle}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight">
              {copy.cardValue}
            </p>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-4/5 rounded-full bg-secondary" />
            </div>
          </div>

          <div
            data-auth-card="secondary"
            className="absolute bottom-2 right-0 w-60 rounded-3xl border border-white/15 bg-white/95 p-5 text-foreground shadow-2xl xl:right-8"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <SecondaryIcon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-extrabold">{copy.secondaryTitle}</p>
                <p className="text-xs font-medium text-muted-foreground">
                  {copy.secondaryText}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-primary">
              <ShieldCheck className="size-4" aria-hidden="true" />
              Proses transparan dan aman
            </div>
          </div>
        </div>
      </div>

      <p className="relative z-10 text-xs font-medium text-white/50">
        {copy.footer}
      </p>
    </aside>
  );
}
