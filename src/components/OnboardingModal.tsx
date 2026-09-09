"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STEPS = [
  { 
    title: "Selamat datang di UanginKuy", 
    description: "Mulai ubah sampah daur ulang Anda menjadi saldo dengan mudah, langsung dari rumah." 
  },
  { 
    title: "Jadwalkan Penjemputan", 
    description: "Pilih waktu luang Anda, kurir kami akan datang menjemput dan menimbang secara transparan." 
  },
  { 
    title: "Terima Saldo", 
    description: "Pantau terus dampak lingkungan Anda dan nikmati saldo dari hasil daur ulang." 
  },
];

export function OnboardingModal({
  completeAction
}: {
  completeAction?: (destination: "dashboard" | "booking") => Promise<void>
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      setOpen(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  const handleComplete = () => {
    if (completeAction) {
      startTransition(async () => {
        await completeAction("dashboard");
        setOpen(false);
      });
    } else {
      setOpen(false);
    }
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen && !isPending) handleComplete();
      else if (isOpen) setOpen(true);
    }}>
      <DialogContent className="sm:max-w-md border-primary/20 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{STEPS[step].title}</DialogTitle>
          <DialogDescription className="text-base mt-2">
            {STEPS[step].description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center gap-2 py-4">
          {STEPS.map((_, i) => (
            <div 
              key={i} 
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? "w-6 bg-primary" : "w-2 bg-primary/20"
              }`} 
            />
          ))}
        </div>

        <DialogFooter className="sm:justify-between flex-row items-center mt-2">
          <div className="text-sm text-muted-foreground font-medium">
            Langkah {step + 1} dari {STEPS.length}
          </div>
          <Button
            onClick={handleNext}
            loading={isPending}
            loadingLabel="Memproses..."
            className="font-bold px-6"
          >
            {step === STEPS.length - 1 ? "Mulai Sekarang" : "Selanjutnya"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
