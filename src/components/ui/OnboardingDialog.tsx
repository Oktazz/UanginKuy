"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { ArrowRight, MapPin, TicketCheck, WalletCards, X } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type OnboardingDestination = "dashboard" | "booking";

interface OnboardingDialogProps {
  userName?: string | null;
  error?: string;
  completeAction: (destination: OnboardingDestination) => Promise<void>;
}

const features = [
  {
    icon: MapPin,
    title: "Simpan beberapa alamat",
    description: "Pilih lokasi penjemputan saat membuat booking.",
  },
  {
    icon: TicketCheck,
    title: "Pantau setiap tiket",
    description: "Ikuti jadwal dan progres penjemputan dengan jelas.",
  },
  {
    icon: WalletCards,
    title: "Kelola hasil penjualan",
    description: "Nilai sampah yang selesai ditimbang masuk ke saldo.",
  },
] as const;

export function OnboardingDialog({
  userName,
  error,
  completeAction,
}: OnboardingDialogProps) {
  const [open, setOpen] = useState(true);
  const [isPending, startTransition] = useTransition();
  const firstName = userName?.trim().split(/\s+/)[0] || "Nasabah baru";

  const finishOnboarding = (destination: OnboardingDestination) => {
    startTransition(async () => {
      await completeAction(destination);
      setOpen(false);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={() => finishOnboarding("dashboard")}
    >
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100dvh-2rem)] w-[calc(100%-1.5rem)] max-w-3xl gap-0 overflow-y-auto rounded-[1.75rem] border-white/80 bg-surface p-0 shadow-[0_30px_90px_rgba(13,83,14,0.24)] motion-reduce:data-[state=closed]:animate-none motion-reduce:data-[state=open]:animate-none sm:w-full sm:rounded-[2rem]"
      >
        <div className="relative overflow-hidden bg-primary-dark px-5 pb-7 pt-8 text-white sm:px-8 sm:pb-8">
          <div className="pointer-events-none absolute -right-16 -top-20 size-52 rounded-full border border-white/10 bg-white/[0.06]" />
          <div className="pointer-events-none absolute -bottom-28 left-1/3 size-56 rounded-full bg-secondary/15 blur-2xl" />

          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              disabled={isPending}
              aria-label="Tutup onboarding"
              className="absolute right-4 top-4 z-10 size-11 items-center justify-center rounded-2xl bg-white/10 text-white/80 hover:bg-white/20 hover:text-white focus-visible:ring-secondary disabled:cursor-not-allowed disabled:opacity-60"
            >
              <X className="size-5" aria-hidden="true" />
            </Button>
          </DialogClose>

          <DialogHeader className="relative pr-10 text-left">
            <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-white p-2 shadow-lg">
              <Image
                src="/logo.png"
                alt="UanginKuy Logo"
                width={36}
                height={36}
                className="size-8 object-contain"
                priority
              />
            </div>
            <DialogTitle className="text-2xl font-extrabold leading-tight tracking-[-0.03em] sm:text-3xl">
              Selamat datang, {firstName}!
            </DialogTitle>
            <DialogDescription className="mt-2 max-w-xl text-sm font-medium leading-6 text-white/75 sm:text-base">
              Sampah terpilah di rumah kini bisa kamu ubah menjadi nilai tanpa
              harus datang ke bank sampah.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-6 p-5 sm:p-8">
          <div className="grid gap-3 sm:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-2xl border border-border bg-background/55 p-4"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h2 className="mt-4 text-sm font-extrabold text-foreground">
                  {title}
                </h2>
                <p className="mt-1 text-xs font-medium leading-5 text-muted-foreground">
                  {description}
                </p>
              </article>
            ))}
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-2xl border border-error/20 bg-error/10 px-4 py-3 text-sm font-semibold text-error"
            >
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              disabled={isPending}
              onClick={() => finishOnboarding("dashboard")}
              className="min-h-12 rounded-xl px-5 py-3 font-bold text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-primary disabled:opacity-60"
            >
              Jelajahi dashboard dulu
            </Button>
            <Button
              type="button"
              onClick={() => finishOnboarding("booking")}
              loading={isPending}
              loadingLabel="Menyiapkan..."
              className="min-h-12 rounded-xl bg-primary px-6 py-3 font-extrabold text-primary-foreground shadow-[0_12px_28px_rgba(48,109,41,0.24)] transition-[background-color,box-shadow] hover:bg-primary-dark hover:shadow-[0_14px_32px_rgba(13,83,14,0.28)] focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"
            >
              <ArrowRight className="size-4" aria-hidden="true" />
              Mulai Setor Sampah
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
