"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: "Bagaimana sampah saya dijemput?",
    a: "Setelah membuat akun, pilih jadwal operasional dan alamat penjemputan. Kamu akan menerima tiket digital untuk ditunjukkan saat kurir tiba.",
  },
  {
    q: "Jenis sampah apa yang bisa disetor?",
    a: "Kategori yang diterima mengikuti daftar aktif dari pengelola bank sampah. Jenis material dan harga per kilogram selalu ditampilkan di aplikasi.",
  },
  {
    q: "Bagaimana nilai sampah dihitung?",
    a: "Kurir menimbang sampah per kategori dengan timbangan digital. Sistem mengalikan berat dengan harga aktif sehingga hasilnya dapat kamu periksa.",
  },
  {
    q: "Apakah saldo bisa dicairkan?",
    a: "Ya. Saldo yang memenuhi ketentuan penarikan dapat diajukan ke rekening bank atau dompet digital yang tersedia di aplikasi.",
  },
];

export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <div className="space-y-4">
      {FAQS.map((faq, i) => {
        const isOpen = openIndex === i;

        return (
          <div
            key={i}
            className={`rounded-2xl border transition-all duration-300 overflow-hidden reveal-up ${
              isOpen
                ? "border-primary/40 bg-surface shadow-md ring-1 ring-primary/10"
                : "border-border bg-surface/90 hover:border-primary/25 hover:shadow-sm"
            }`}
            style={{ transitionDelay: `${(i + 1) * 80}ms` }}
          >
            <button
              type="button"
              onClick={() => toggleFaq(i)}
              aria-expanded={isOpen}
              aria-controls={`faq-answer-${i}`}
              id={`faq-question-${i}`}
              className="flex w-full min-h-12 cursor-pointer items-center justify-between gap-4 p-5 text-left font-bold outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors duration-200 group"
            >
              <span
                className={`text-lg transition-colors duration-200 ${
                  isOpen ? "text-primary" : "text-foreground group-hover:text-primary"
                }`}
              >
                {faq.q}
              </span>
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                  isOpen
                    ? "bg-primary/10 text-primary rotate-180"
                    : "bg-muted/80 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary rotate-0"
                }`}
              >
                <ChevronDown className="h-5 w-5 transition-transform duration-300" aria-hidden="true" />
              </div>
            </button>

            {/* Smooth CSS Grid Height Animation */}
            <div
              id={`faq-answer-${i}`}
              role="region"
              aria-labelledby={`faq-question-${i}`}
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                isOpen
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-5 pb-5 pt-1 text-muted-foreground leading-relaxed border-t border-border/40">
                  <p>{faq.a}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
