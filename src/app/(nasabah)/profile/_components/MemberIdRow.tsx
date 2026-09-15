"use client";

import { useState } from "react";
import { QrCode, Copy, Check, ShieldCheck } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface MemberIdRowProps {
  accountNumber?: string | null;
  userName?: string | null;
}

export function MemberIdRow({ accountNumber, userName }: MemberIdRowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const displayId = accountNumber || "UKN-MEMBER";

  const handleCopy = () => {
    if (!accountNumber) return;
    void navigator.clipboard.writeText(accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center px-4 py-4 space-x-3 group hover:bg-gray-50/80 transition-colors duration-200 text-left cursor-pointer"
        aria-label={`ID Nasabah: ${displayId}. Klik untuk melihat QR Code.`}
      >
        <div className="w-10 h-10 bg-primary/10 group-hover:bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-200">
          <span className="font-mono text-xs font-bold text-primary">ID</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            ID Nasabah / Member
          </p>
          <p className="font-mono text-sm font-bold text-primary mt-0.5 tracking-wider truncate">
            {displayId}
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/5 text-primary text-xs font-semibold group-hover:bg-primary group-hover:text-white transition-all duration-200 flex-shrink-0">
          <QrCode size={14} />
          <span>Lihat QR</span>
        </div>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6 bg-white border border-gray-100 shadow-2xl">
          <DialogHeader className="text-center sm:text-center space-y-1">
            <DialogTitle className="text-lg font-bold text-gray-900">
              QR Code Akun Nasabah
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Tunjukkan QR Code ini kepada admin loket untuk verifikasi setor sampah (Drop-off) atau penarikan tunai.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center pt-2 pb-1 space-y-4">
            {/* QR Box */}
            <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center">
              <QRCodeSVG
                value={displayId}
                size={200}
                level="H"
                includeMargin={false}
              />
            </div>

            {/* Member ID and Copy Button */}
            <div className="w-full bg-gray-50 rounded-2xl p-3 border border-gray-200/80 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Member ID ({userName || "Nasabah"})
                </p>
                <p className="font-mono text-base font-extrabold text-primary tracking-wider">
                  {displayId}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="p-2.5 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 transition cursor-pointer shadow-xs"
                title="Salin ID"
              >
                {copied ? (
                  <Check size={16} className="text-primary" />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>

          </div>

          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="w-full h-11 rounded-xl font-bold border-gray-200 text-gray-700 hover:bg-gray-100"
            >
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
