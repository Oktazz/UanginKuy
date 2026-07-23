"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QrCode, Keyboard, ArrowRight } from "lucide-react";
import { QRScanner } from "@/components/ui/QRScanner";

export default function ScannerPage() {
  const router = useRouter();
  const [manualId, setManualId] = useState("");
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');

  const handleScanSuccess = (decodedText: string) => {
    // Assuming the decoded text is the ticket ID
    // e.g. a UUID or ticket number
    if (decodedText) {
      router.push(`/kurir/pickup/${decodedText}`);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualId.trim()) {
      router.push(`/kurir/pickup/${manualId.trim()}`);
    }
  };

  return (
    <div className="space-y-8 pb-8 max-w-md mx-auto">
      <header className="mb-6 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
          <QrCode size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Pindai Tiket Nasabah</h2>
        <p className="text-sm text-gray-500 mt-2 px-4">Pindai kode QR pada aplikasi nasabah atau masukkan ID secara manual.</p>
      </header>

      {/* Mode Switcher */}
      <div className="bg-surface p-1 rounded-2xl flex shadow-sm border border-gray-100 max-w-xs mx-auto">
        <button 
          onClick={() => setMode('camera')}
          className={`flex-1 flex items-center justify-center py-2.5 rounded-2xl font-semibold text-sm transition-all duration-300 ${mode === 'camera' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
        >
          <QrCode size={18} className="mr-2" /> Kamera
        </button>
        <button 
          onClick={() => setMode('manual')}
          className={`flex-1 flex items-center justify-center py-2.5 rounded-2xl font-semibold text-sm transition-all duration-300 ${mode === 'manual' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
        >
          <Keyboard size={18} className="mr-2" /> Manual
        </button>
      </div>

      {mode === 'camera' ? (
        <div className="animate-in fade-in zoom-in duration-300">
          <QRScanner onScanSuccess={handleScanSuccess} />
        </div>
      ) : (
        <div className="bg-surface rounded-3xl p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
          <h3 className="font-bold text-gray-900 mb-4">Input ID Tiket Manual</h3>
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Contoh: 123e4567-e89b-12d3..."
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
                required
              />
            </div>
            <button
              type="submit"
              disabled={!manualId.trim()}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold flex justify-center items-center hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              Proses Tiket <ArrowRight size={18} className="ml-2" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
