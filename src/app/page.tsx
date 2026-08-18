import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CalendarCheck2,
  Camera,
  CheckCircle,
  ChevronDown,
  CloudSync,
  Handshake,
  Home,
  Leaf,
  LineChart,
  Link as LinkIcon,
  Menu,
  QrCode,
  ReceiptText,
  Recycle,
  Route,
  Scale,
  Trash2,
  Truck,
  User,
  WalletCards,
  Building2
} from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import ScrollObserver from "./ScrollObserver";

export const metadata: Metadata = {
  title: "UanginKuy | Sampah Dijemput, Saldo Bertambah",
  description:
    "Jadwalkan penjemputan sampah dari rumah, pantau penimbangan transparan, dan kelola saldo daur ulang bersama UanginKuy.",
};

export default async function Page() {
  const supabase = await createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <>
      <ScrollObserver />
      <div className="bg-background text-foreground font-sans antialiased selection:bg-primary selection:text-primary-foreground min-h-screen">
        {/* Top Navigation */}
        <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-transparent transition-all duration-300" id="navbar">
          <div className="flex justify-between items-center h-20 px-4 md:px-8 max-w-7xl mx-auto">
            {/* Brand */}
            <Link className="flex items-center gap-2 group" href="/">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm group-hover:scale-110 transition-transform duration-300">
                <Leaf className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-xl font-bold text-primary transition-colors duration-300 tracking-tight">UanginKuy</span>
            </Link>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-8">
              <a className="text-muted-foreground font-medium hover:text-primary transition-colors duration-300 text-base" href="#fitur">Fitur</a>
              <a className="text-muted-foreground font-medium hover:text-primary transition-colors duration-300 text-base" href="#cara-kerja">Cara Kerja</a>
              <a className="text-muted-foreground font-medium hover:text-primary transition-colors duration-300 text-base" href="#faq">FAQ</a>
            </div>
            
            {/* Actions */}
            <div className="hidden md:flex items-center gap-4">
              <Link className="text-primary font-medium hover:text-primary-dark transition-colors duration-300 px-4 py-2 rounded-lg hover:bg-muted" href="/login">Masuk</Link>
              <Link className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium shadow-sm hover:shadow-lg hover:-translate-y-1 hover:bg-primary-dark transition-all duration-300 active:scale-95" href="/register">Daftar</Link>
            </div>
            
            {/* Mobile Menu Button */}
            <button className="md:hidden text-muted-foreground p-2 rounded-lg hover:bg-muted transition-colors duration-300">
              <Menu className="w-7 h-7" />
            </button>
          </div>
        </nav>

        {/* Main Canvas */}
        <main className="pt-24 pb-24 overflow-hidden">
          {/* Hero Section */}
          <section className="relative max-w-7xl mx-auto px-4 md:px-8 pt-12 md:pt-24 pb-24">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] -z-10 translate-x-1/3 -translate-y-1/4"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/30 rounded-full blur-[80px] -z-10 -translate-x-1/4 translate-y-1/4"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
              {/* Hero Copy */}
              <div className="max-w-2xl z-10">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 leading-tight reveal-up tracking-tight">
                  Sampah rumahmu dijemput. <span className="text-primary">Nilainya masuk saldo.</span>
                </h1>
                <p className="text-lg text-muted-foreground mb-8 max-w-lg reveal-up delay-100">
                  Pilah sampah, pilih jadwal, lalu pantau penjemputan dan hasil timbang dalam satu aplikasi.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mb-10 reveal-up delay-200">
                  <Link className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-medium shadow-sm hover:shadow-lg hover:-translate-y-1 hover:bg-primary-dark transition-all duration-300 group" href="/register">
                    Daftar Sekarang
                    <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                  <Link className="inline-flex items-center justify-center gap-2 bg-surface text-foreground px-8 py-4 rounded-xl font-medium border border-border hover:bg-muted hover:-translate-y-1 hover:shadow-md transition-all duration-300 group" href="/login">
                    Masuk ke akun
                    <ChevronDown className="w-5 h-5 -rotate-90 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-muted-foreground reveal-up delay-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Pendaftaran ringkas
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Hasil timbang tercatat
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Jadwal mudah dipantau
                  </div>
                </div>
              </div>
              
              {/* Hero Visual */}
              <div className="relative z-10 w-full max-w-[500px] mx-auto lg:ml-auto reveal-up animate-delay-400">
                <div className="animate-float">
                  <div className="bg-white/80 backdrop-blur-md border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all duration-500 hover:shadow-2xl">
                  {/* Header */}
                  <div className="flex items-center mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                        <Leaf className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-foreground text-sm tracking-tight">UanginKuy</span>
                    </div>
                  </div>
                  {/* Main Balance Card */}
                  <div className="bg-primary text-primary-foreground rounded-2xl p-5 mb-4 relative overflow-hidden shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3"></div>
                    <p className="text-sm opacity-90 mb-1">Saldo sampah</p>
                    <p className="text-2xl font-bold mb-2">Siap bertambah</p>
                    <p className="text-xs opacity-80 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      setelah penimbangan selesai
                    </p>
                    <div className="absolute bottom-4 right-4 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <WalletCards className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-primary mb-3">
                        <Recycle className="w-4 h-4" />
                      </div>
                      <p className="text-[10px] text-muted-foreground mb-1">Sampah terkumpul</p>
                      <p className="font-bold text-sm text-foreground">Dampak terus tercatat</p>
                    </div>
                    <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-primary mb-3">
                        <ReceiptText className="w-4 h-4" />
                      </div>
                      <p className="text-[10px] text-muted-foreground mb-1">Nilai transparan</p>
                      <p className="font-bold text-sm text-foreground">Sesuai hasil timbang</p>
                    </div>
                  </div>
                  {/* Next Pickup */}
                  <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm flex items-start gap-4 mb-4 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                    <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                      <CalendarCheck2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-bold text-sm text-foreground">Penjemputan berikutnya</p>
                        <span className="px-2 py-0.5 rounded-full bg-secondary text-primary-dark text-[10px] font-semibold">Terjadwal</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">Alamat dan jadwal tampil di satu tempat</p>
                    </div>
                  </div>
                  {/* Sync Status */}
                  <div className="bg-muted border border-border border-dashed rounded-xl p-3 flex items-center gap-3 hover:bg-muted/80 transition-colors duration-300">
                    <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-primary shadow-sm">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Timbangan digital</p>
                      <p className="font-semibold text-xs text-foreground">Berat tersinkron</p>
                    </div>
                    <CloudSync className="text-primary ml-auto w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

          {/* Value Proposition Section */}
          <section className="max-w-7xl mx-auto px-4 md:px-8 py-24" id="fitur">
            <div className="text-center max-w-3xl mx-auto mb-16 reveal-up">
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-6">
                Menabung sampah tidak harus merepotkan
              </h2>
              <p className="text-lg text-muted-foreground">
                UanginKuy menghubungkan rumahmu dengan proses penjemputan, penimbangan, dan pencatatan nilai dalam satu alur.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-surface rounded-2xl p-8 border border-border shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 reveal-up delay-100">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-primary mb-6">
                  <Truck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Tak perlu antar sendiri</h3>
                <p className="text-muted-foreground">Pilih jadwal penjemputan, lalu kurir datang ke alamatmu.</p>
              </div>
              <div className="bg-surface rounded-2xl p-8 border border-border shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 reveal-up delay-200">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-primary mb-6">
                  <Scale className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Timbang transparan</h3>
                <p className="text-muted-foreground">Berat dan nilai sampah tercatat saat proses penjemputan.</p>
              </div>
              <div className="bg-surface rounded-2xl p-8 border border-border shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden reveal-up delay-300 group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[100px] transition-transform duration-500 group-hover:scale-110"></div>
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-primary mb-6 relative z-10">
                  <LineChart className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3 relative z-10">Dampakmu tercatat</h3>
                <p className="text-muted-foreground relative z-10">Lihat total sampah dan dampak lingkungan dari kebiasaan baikmu.</p>
              </div>
            </div>
          </section>

          {/* Steps Section */}
          <section className="bg-surface py-24 border-y border-border" id="cara-kerja">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
              <div className="mb-12 reveal-up">
                <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4 max-w-2xl">
                  Dari rumah ke saldo dalam empat langkah
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl">
                  Prosesnya dirancang agar kamu selalu tahu apa yang terjadi pada sampahmu.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-background rounded-2xl p-6 border border-border shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col h-full relative group reveal-up delay-100">
                  <div className="text-5xl font-black text-muted absolute top-6 right-6 z-0 transition-transform duration-300 group-hover:scale-110">01</div>
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mb-12 relative z-10 shadow-md">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <div className="mt-auto relative z-10">
                    <h3 className="font-bold text-lg text-foreground mb-2">Pilah sampah</h3>
                    <p className="text-sm text-muted-foreground">Pisahkan material yang bisa didaur ulang di rumah.</p>
                  </div>
                </div>
                <div className="bg-background rounded-2xl p-6 border border-border shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col h-full relative group reveal-up delay-200">
                  <div className="text-5xl font-black text-muted absolute top-6 right-6 z-0 transition-transform duration-300 group-hover:scale-110">02</div>
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mb-12 relative z-10 shadow-md">
                    <CalendarCheck2 className="w-6 h-6" />
                  </div>
                  <div className="mt-auto relative z-10">
                    <h3 className="font-bold text-lg text-foreground mb-2">Pilih jadwal</h3>
                    <p className="text-sm text-muted-foreground">Tentukan hari penjemputan yang tersedia di aplikasi.</p>
                  </div>
                </div>
                <div className="bg-background rounded-2xl p-6 border border-border shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col h-full relative group reveal-up delay-300">
                  <div className="text-5xl font-black text-muted absolute top-6 right-6 z-0 transition-transform duration-300 group-hover:scale-110">03</div>
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mb-12 relative z-10 shadow-md">
                    <Handshake className="w-6 h-6" />
                  </div>
                  <div className="mt-auto relative z-10">
                    <h3 className="font-bold text-lg text-foreground mb-2">Serahkan & timbang</h3>
                    <p className="text-sm text-muted-foreground">Kurir menjemput dan menimbang setiap kategori sampah.</p>
                  </div>
                </div>
                <div className="bg-background rounded-2xl p-6 border border-border shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col h-full relative group reveal-up delay-400">
                  <div className="text-5xl font-black text-muted absolute top-6 right-6 z-0 transition-transform duration-300 group-hover:scale-110">04</div>
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mb-12 relative z-10 shadow-md">
                    <WalletCards className="w-6 h-6" />
                  </div>
                  <div className="mt-auto relative z-10">
                    <h3 className="font-bold text-lg text-foreground mb-2">Terima saldo</h3>
                    <p className="text-sm text-muted-foreground">Nilai hasil timbang otomatis masuk ke saldo UanginKuy.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* App Features Section */}
          <section className="bg-primary py-24 text-primary-foreground relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(white_1px,transparent_1px)] bg-[size:32px_32px]"></div>
            <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
              <div className="mb-16 reveal-up">
                <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6 max-w-2xl">
                  Semua yang kamu butuhkan untuk mulai mendaur ulang
                </h2>
                <p className="text-lg text-white/80 max-w-2xl">
                  Teknologi bekerja di belakang layar. Kamu cukup memilah, menjadwalkan, dan memantau.
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 hover:bg-white/15 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 reveal-up delay-100">
                  <div className="w-14 h-14 rounded-2xl bg-secondary text-primary-dark flex items-center justify-center mb-6">
                    <Camera className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-white">Kenali nilai sampah sebelum dijemput</h3>
                  <p className="text-white/80 max-w-xl">Unggah foto untuk mendapatkan estimasi kategori dan nilai awal, lalu lanjutkan pemesanan saat kamu siap.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 hover:bg-white/15 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 reveal-up delay-200">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center mb-6">
                    <QrCode className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">Tiket QR siap dipindai</h3>
                  <p className="text-white/80 text-sm">Setiap penjemputan memiliki tiket digital yang menghubungkan sampahmu dengan proses timbang.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 hover:bg-white/15 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 reveal-up delay-300">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center mb-6">
                    <Route className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">Status mudah dipantau</h3>
                  <p className="text-white/80 text-sm">Periksa jadwal dan perkembangan penjemputan tanpa menebak-nebak.</p>
                </div>
                <div className="lg:col-span-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 hover:bg-white/15 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 reveal-up delay-400">
                  <div className="w-14 h-14 rounded-2xl bg-secondary text-primary-dark flex items-center justify-center mb-6">
                    <Bot className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-white">Ada UanginBot saat kamu perlu bantuan</h3>
                  <p className="text-white/80 max-w-xl">Tanyakan cara memakai aplikasi, kategori sampah, saldo, atau status penjemputan langsung dari dashboard.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Ecosystem Section */}
          <section className="max-w-7xl mx-auto px-4 md:px-8 py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="reveal-up">
                <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-6">
                  Rumah, kurir, dan bank sampah bekerja dalam alur yang sama
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Jadwal tersusun, rute penjemputan lebih jelas, dan hasil timbang langsung terhubung ke akunmu.
                </p>
                <ul className="space-y-6">
                  <li className="flex items-start gap-4 hover:-translate-y-1 transition-transform duration-300">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-primary shrink-0 mt-1 shadow-sm">
                      <CalendarCheck2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground mb-1 mt-2">Jadwal operasional yang selalu diperbarui</h4>
                    </div>
                  </li>
                  <li className="flex items-start gap-4 hover:-translate-y-1 transition-transform duration-300">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-primary shrink-0 mt-1 shadow-sm">
                      <Route className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground mb-1 mt-2">Rute kurir disusun untuk penjemputan harian</h4>
                    </div>
                  </li>
                  <li className="flex items-start gap-4 hover:-translate-y-1 transition-transform duration-300">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-primary shrink-0 mt-1 shadow-sm">
                      <Scale className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground mb-1 mt-2">Timbangan digital mengurangi pencatatan manual</h4>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="bg-surface border border-border rounded-3xl p-8 shadow-md relative reveal-up delay-200 hover:shadow-xl transition-shadow duration-500">
                <div className="absolute top-[45%] left-12 right-12 h-1 bg-border -translate-y-1/2 hidden md:block z-0"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                  <div className="bg-background border border-border rounded-2xl p-6 text-center flex flex-col items-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                    <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                      <Home className="w-8 h-8" />
                    </div>
                    <h4 className="font-bold text-sm text-foreground mb-1">Rumahmu</h4>
                    <p className="text-xs text-muted-foreground">Permintaan dibuat</p>
                  </div>
                  <div className="bg-background border border-border rounded-2xl p-6 text-center flex flex-col items-center shadow-sm relative md:-translate-y-4 hover:shadow-md hover:-translate-y-5 transition-all duration-300">
                    <div className="w-16 h-16 rounded-full bg-secondary text-primary-dark flex items-center justify-center mb-4">
                      <Truck className="w-8 h-8" />
                    </div>
                    <h4 className="font-bold text-sm text-foreground mb-1">Kurir</h4>
                    <p className="text-xs text-muted-foreground">Penjemputan aktif</p>
                  </div>
                  <div className="bg-background border border-border rounded-2xl p-6 text-center flex flex-col items-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                    <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                      <Building2 className="w-8 h-8" />
                    </div>
                    <h4 className="font-bold text-sm text-foreground mb-1">Bank sampah</h4>
                    <p className="text-xs text-muted-foreground">Nilai tercatat</p>
                  </div>
                </div>
                <div className="mt-8 bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center justify-center gap-3 text-primary text-sm font-semibold">
                  <LinkIcon className="w-5 h-5" />
                  Setiap tahap tersambung ke satu tiket penjemputan.
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="max-w-3xl mx-auto px-4 md:px-8 py-24" id="faq">
            <div className="text-center mb-12 reveal-up">
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
                Pertanyaan yang sering ditanyakan
              </h2>
              <p className="text-lg text-muted-foreground">
                Jawaban singkat sebelum kamu mulai menabung sampah bersama UanginKuy.
              </p>
            </div>
            <div className="space-y-4">
              {[
                {
                  q: "Bagaimana sampah saya dijemput?",
                  a: "Setelah membuat akun, pilih jadwal operasional dan alamat penjemputan. Kamu akan menerima tiket digital untuk ditunjukkan saat kurir tiba."
                },
                {
                  q: "Jenis sampah apa yang bisa disetor?",
                  a: "Kategori yang diterima mengikuti daftar aktif dari pengelola bank sampah. Jenis material dan harga per kilogram selalu ditampilkan di aplikasi."
                },
                {
                  q: "Bagaimana nilai sampah dihitung?",
                  a: "Kurir menimbang sampah per kategori dengan timbangan digital. Sistem mengalikan berat dengan harga aktif sehingga hasilnya dapat kamu periksa."
                },
                {
                  q: "Apakah saldo bisa dicairkan?",
                  a: "Ya. Saldo yang memenuhi ketentuan penarikan dapat diajukan ke rekening bank atau dompet digital yang tersedia di aplikasi."
                }
              ].map((faq, i) => (
                <details key={i} className="group rounded-2xl border border-border bg-surface p-5 open:border-primary/25 open:shadow-sm reveal-up" style={{ transitionDelay: `${(i+1)*100}ms` }}>
                  <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-4 font-bold outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
                    <span className="text-lg text-foreground">{faq.q}</span>
                    <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <p className="mt-3 text-muted-foreground leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>
          </section>

          {/* Final CTA */}
          <section className="max-w-7xl mx-auto px-4 md:px-8 mb-24 reveal-up">
            <div className="bg-primary rounded-3xl overflow-hidden relative shadow-md hover:shadow-2xl transition-shadow duration-500">
              <div className="absolute top-0 left-0 w-64 h-64 bg-primary-dark rounded-full -translate-x-1/2 -translate-y-1/2 opacity-50"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-dark rounded-full translate-x-1/3 translate-y-1/3 opacity-50"></div>
              <div className="relative z-10 px-8 py-20 md:py-24 text-center max-w-3xl mx-auto">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 hover:scale-110 transition-transform duration-300">
                  <Leaf className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6">
                  Siap mengubah sampah jadi nilai?
                </h2>
                <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto">
                  Buat akun, pilih jadwal pertamamu, dan biarkan UanginKuy membantu proses berikutnya.
                </p>
                <Link className="inline-flex items-center justify-center gap-2 bg-secondary text-primary-dark px-10 py-4 rounded-xl font-bold hover:bg-secondary/90 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 shadow-md active:scale-95 group" href="/register">
                  Daftar Sekarang
                  <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-muted w-full py-12 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-4 md:px-8 max-w-7xl mx-auto">
            <div className="md:col-span-1 flex flex-col gap-4">
              <Link className="flex items-center gap-2 group" href="/">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Leaf className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-xl font-bold text-primary transition-colors duration-300 tracking-tight">UanginKuy</span>
              </Link>
              <p className="text-base text-muted-foreground max-w-xs">
                Bank sampah digital, langsung dari rumah.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <h4 className="font-semibold text-foreground mb-2">Navigasi</h4>
              <a className="text-muted-foreground hover:text-primary transition-colors duration-300" href="#fitur">Fitur</a>
              <a className="text-muted-foreground hover:text-primary transition-colors duration-300" href="#cara-kerja">Cara Kerja</a>
              <a className="text-muted-foreground hover:text-primary transition-colors duration-300" href="#faq">FAQ</a>
            </div>
            <div className="flex flex-col gap-3">
              <h4 className="font-semibold text-foreground mb-2">Legal</h4>
              <a className="text-muted-foreground hover:text-primary transition-colors duration-300" href="#">Privacy Policy</a>
              <a className="text-muted-foreground hover:text-primary transition-colors duration-300" href="#">Terms of Service</a>
            </div>
            <div className="flex flex-col gap-3 items-start md:items-end">
              <h4 className="font-semibold text-foreground mb-2 md:hidden">Akun</h4>
              <Link className="text-muted-foreground hover:text-primary transition-colors duration-300 font-medium" href="/login">Masuk</Link>
              <Link className="text-primary font-semibold hover:text-primary-dark transition-colors duration-300" href="/register">Daftar Sekarang</Link>
            </div>
            <div className="md:col-span-4 mt-8 pt-8 border-t border-border text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-base text-muted-foreground">© 2026 UanginKuy. Turning waste into value for a greener future.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
