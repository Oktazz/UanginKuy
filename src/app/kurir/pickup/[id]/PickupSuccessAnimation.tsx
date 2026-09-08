"use client";

import { useRouter } from "next/navigation";

export default function PickupSuccessAnimation() {
  const router = useRouter();

  return (
    <div className="max-w-md mx-auto pb-8">
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center space-y-7 px-6">
        <svg
          viewBox="0 0 120 120"
          className="w-32 h-32 text-emerald-600"
          role="img"
          aria-label="Penjemputan berhasil"
        >
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            pathLength={1}
            className="success-draw"
            style={{ animationDuration: "420ms" }}
          />
          <path
            d="M38 62 L54 78 L84 44"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            className="success-draw"
            style={{ animationDelay: "300ms", animationDuration: "450ms" }}
          />
        </svg>

        <div className="success-rise" style={{ animationDelay: "780ms" }}>
          <h2 className="text-2xl font-extrabold text-gray-900">Berhasil!</h2>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Tiket sudah diselesaikan dan saldo nasabah telah tercatat.
          </p>
        </div>

        <div className="success-rise w-full max-w-xs" style={{ animationDelay: "1150ms" }}>
          <button
            type="button"
            onClick={() => router.push("/kurir/dashboard")}
            className="w-full bg-primary text-white font-semibold py-3 rounded-2xl flex items-center justify-center shadow-md hover:bg-primary-dark transition"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}