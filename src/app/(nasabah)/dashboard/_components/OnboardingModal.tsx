"use client";

import { useState, useEffect, useRef, useTransition, useSyncExternalStore } from "react";
import { Tour, type TourStep } from "@/components/ui/product-tour";

const STEPS: TourStep[] = [
  {
    target: "#tour-balance",
    title: "Total Saldo Aktif",
    content:
      "Pantau akumulasi saldo dari penjualan sampah daur ulang Anda. Anda dapat menarik saldo kapan saja langsung ke rekening atau e-wallet.",
    placement: "bottom",
    padding: 6,
    radius: 16,
  },
  {
    target: "#tour-assistant",
    title: "Asisten Sortir AI",
    content:
      "Bingung jenis sampah Anda bisa didaur ulang atau tidak? Cek di Asisten Sortir untuk panduan instan dan estimasi nilainya.",
    placement: "bottom",
    padding: 6,
    radius: 16,
  },
  {
    target: ".tour-booking",
    title: "Booking Penjemputan",
    content:
      "Jadwalkan kurir UanginKuy untuk menjemput sampah daur ulang langsung ke alamat Anda tanpa perlu repot keluar rumah.",
    placement: "top",
    padding: 6,
    radius: 14,
  },
  {
    target: ".tour-tickets",
    title: "Tiket & Status Timbangan",
    content:
      "Pantau status penjemputan secara real-time, mulai dari kedatangan kurir hingga rincian berat timbangan dan riwayat transaksi.",
    placement: "top",
    padding: 6,
    radius: 14,
  },
  {
    target: "#tour-ai-chat",
    title: "UanginBot Siap Membantu",
    content:
      "Punya pertanyaan seputar layanan atau tips memilah sampah? Klik ikon UanginBot untuk mengobrol dengan asisten cerdas kami kapan saja!",
    placement: "top",
    padding: 6,
    radius: 9999,
  },
];

export function OnboardingModal({
  completeAction,
}: {
  completeAction?: (destination: "dashboard" | "booking") => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [, startTransition] = useTransition();
  const completedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOpen(true);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  const handleFinishOrSkip = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (completeAction) {
      startTransition(async () => {
        try {
          await completeAction("dashboard");
        } catch (err) {
          console.error("Failed to complete onboarding:", err);
        }
      });
    }
    setOpen(false);
  };

  if (!isHydrated) return null;

  return (
    <Tour
      steps={STEPS}
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleFinishOrSkip();
        else setOpen(true);
      }}
      onFinish={handleFinishOrSkip}
      onSkip={handleFinishOrSkip}
      nextLabel="Lanjut"
      prevLabel="Kembali"
      doneLabel="Mulai Sekarang"
    />
  );
}
