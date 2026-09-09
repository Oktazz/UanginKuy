import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50 dark:bg-gray-900">
      <h1 className="text-8xl font-black text-green-600 dark:text-green-500 tracking-tight">
        404
      </h1>
      <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
        Halaman Tidak Ditemukan
      </h2>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-md">
        Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Beranda
      </Link>
    </main>
  );
}
