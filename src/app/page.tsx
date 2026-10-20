import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import ScrollObserver from "./_components/ScrollObserver";
import { LandingNav } from "./_components/LandingNav";
import { LandingHero } from "./_components/LandingHero";
import { LandingInnovations } from "./_components/LandingInnovations";
import { LandingSteps } from "./_components/LandingSteps";
import { LandingReviews } from "./_components/LandingReviews";
import { LandingBaliBranches } from "./_components/LandingBaliBranches";
import { LandingFaqBot } from "./_components/LandingFaqBot";
import { LandingCta } from "./_components/LandingCta";
import { LandingFooter } from "./_components/LandingFooter";

export const metadata: Metadata = {
  title: "UanginKuy | Sampah Dijemput, Saldo Bertambah — Bank Sampah Modern Bali",
  description:
    "Layanan bank sampah modern berbasis IoT dan AI di Bali. Jadwalkan penjemputan dari rumah, pantau penimbangan digital transparan, dan kelola saldo daur ulang dengan mudah.",
};

export default async function Page(props?: {
  searchParams?: Promise<{ code?: string }>;
}) {
  const searchParams = await props?.searchParams;
  if (searchParams?.code) {
    redirect(`/auth/confirm?code=${encodeURIComponent(searchParams.code)}`);
  }

  const supabase = await createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <>
      <ScrollObserver />
      <div className="bg-[#fdfbf7] text-foreground font-sans antialiased selection:bg-primary selection:text-white min-h-screen">
        <a
          href="#konten-utama"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-white shadow-md"
        >
          Lewati ke konten utama
        </a>

        {/* Floating Rounded Navbar (Shrinks on scroll) */}
        <LandingNav />

        {/* Main Content Flow - Uniform Background #fdfbf7 */}
        <main id="konten-utama" className="overflow-hidden">
          {/* 1. Hero Section */}
          <LandingHero />

          {/* 2. Inovasi Unggulan (Jadwal Selektif Dinamis, Asisten Pilah AI, Timbangan IoT, Optimasi Rute Kurir) */}
          <LandingInnovations />

          {/* 3. Tahapan Memesan dari Rumah (Urutan Bergilir Kiri ke Kanan + Garis Horizontal Tengah + Gambar AI) */}
          <LandingSteps />

          {/* 4. Review Nasabah (Kartu Bergerak 2 Baris: Atas Kiri->Kanan, Bawah Kanan->Kiri) */}
          <LandingReviews />

          {/* 5. Sebaran Cabang Daerah Bali & Kolaborasi Komunitas / Mitra Lingkungan */}
          <LandingBaliBranches />

          {/* 6. FAQ Berdampingan dengan UanginBot AI Assistant */}
          <LandingFaqBot />

          {/* 7. Ajakan Menggunakan Aplikasi */}
          <LandingCta />
        </main>

        {/* 8. Footer */}
        <LandingFooter />
      </div>
    </>
  );
}
