import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ScanSearch } from "lucide-react";

import { WasteSortClient } from "@/components/waste-sort/WasteSortClient";

export const metadata: Metadata = {
  title: "Cek Sampah | UanginKuy",
  description: "Kenali kategori sampah dan dapatkan panduan memilah sebelum penjemputan.",
};

export default function WasteSortPage() {
  return (
    <div className="mx-auto max-w-5xl pb-8">
      <Link href="/dashboard" className="mb-5 inline-flex min-h-11 items-center text-sm font-bold text-gray-500 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        <ArrowLeft size={17} className="mr-2" aria-hidden="true" /> Kembali ke beranda
      </Link>
      <header className="mb-7 max-w-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">Kenali sampah sebelum dijemput</h1>
        <p className="mt-3 text-base leading-7 text-gray-600">Foto sampahmu untuk mengetahui kategori dan cara menyiapkannya. Tidak ada tebakan berat atau saldo—nilai final tetap transparan dari timbangan kurir.</p>
      </header>
      <WasteSortClient />
    </div>
  );
}
