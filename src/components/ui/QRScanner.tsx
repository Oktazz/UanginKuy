"use client";

import { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, AlertCircle, Loader2 } from 'lucide-react';

export function QRScanner({ onScanSuccess }: { onScanSuccess: (text: string) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let html5QrCode: Html5Qrcode | null = null;
    let isMounted = true;

    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode("qr-reader");
        await html5QrCode.start(
          { facingMode: "environment" },
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          (decodedText) => {
            if (html5QrCode && isMounted) {
              try {
                const stopPromise = html5QrCode.stop();
                if (stopPromise) {
                  stopPromise.then(() => {
                    onScanSuccess(decodedText);
                  }).catch(err => {
                    console.log('Stop failed', err);
                    onScanSuccess(decodedText);
                  });
                } else {
                  onScanSuccess(decodedText);
                }
              } catch (e) {
                console.log('Sync stop error', e);
                onScanSuccess(decodedText);
              }
            }
          },
          (errorMessage) => {
            // Ignore routine scan errors
          }
        );
        if (isMounted) setIsStarting(false);
      } catch (err) {
        if (isMounted) {
          setError("Gagal mengakses kamera. Pastikan Anda telah memberikan izin kamera.");
          setIsStarting(false);
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (html5QrCode) {
        try {
          const stopPromise = html5QrCode.stop();
          if (stopPromise) {
             stopPromise.catch((e) => console.log('Cleanup stop failed', e));
          }
        } catch (e) {
          console.log('Sync cleanup stop error', e);
        }
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="w-full max-w-sm mx-auto bg-surface rounded-3xl overflow-hidden shadow-sm border border-gray-100 relative min-h-[300px] flex items-center justify-center">
      {isStarting && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10">
          <Loader2 size={32} className="animate-spin text-primary mb-3" />
          <p className="text-sm font-medium text-gray-500">Membuka kamera...</p>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10 p-6 text-center">
          <AlertCircle size={40} className="text-error mb-3" />
          <p className="text-sm font-medium text-gray-700">{error}</p>
        </div>
      )}
      
      <div id="qr-reader" className="w-full"></div>
      
      {/* Target Box Overlay */}
      {!isStarting && !error && (
        <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40 z-20">
          <div className="w-full h-full border-2 border-primary border-dashed opacity-70"></div>
        </div>
      )}
    </div>
  );
}
