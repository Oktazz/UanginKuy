"use client";

import { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { AlertCircle, Loader2 } from "lucide-react";

export function QRScanner({ onScanSuccess }: { onScanSuccess: (text: string) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const elementId = useRef(`qr-reader-${Math.random().toString(36).slice(2, 9)}`).current;
  const onScanSuccessRef = useRef(onScanSuccess);
  onScanSuccessRef.current = onScanSuccess;

  useEffect(() => {
    if (typeof window === "undefined") return;

    let isMounted = true;
    let scannerInstance: Html5Qrcode | null = null;
    const activeStreams = new Set<MediaStream>();

    // Intercept getUserMedia so we directly track every camera stream requested
    const originalGetUserMedia = navigator?.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices);
    if (navigator?.mediaDevices && originalGetUserMedia) {
      navigator.mediaDevices.getUserMedia = async (constraints) => {
        const stream = await originalGetUserMedia(constraints);
        if (!isMounted) {
          // If the user already navigated away while permissions/stream was resolving,
          // stop all tracks immediately!
          stream.getTracks().forEach((track) => {
            try {
              track.stop();
            } catch {}
          });
        } else {
          activeStreams.add(stream);
        }
        return stream;
      };
    }

    const killAllTracks = () => {
      // 1. Stop all tracked media streams directly at hardware level
      activeStreams.forEach((stream) => {
        try {
          stream.getTracks().forEach((track) => {
            try {
              track.stop();
            } catch {}
          });
        } catch {}
      });
      activeStreams.clear();

      // 2. Scan any video element in document as safety net
      try {
        const videos = document.querySelectorAll("video");
        videos.forEach((video) => {
          const stream = video.srcObject as MediaStream | null;
          if (stream) {
            stream.getTracks().forEach((track) => {
              try {
                track.stop();
              } catch {}
            });
            video.srcObject = null;
          }
        });
      } catch {}
    };

    const stopScanner = async () => {
      const scanner = scannerInstance;
      scannerInstance = null;
      if (scanner) {
        try {
          if (scanner.isScanning) {
            await scanner.stop();
          }
        } catch (e) {
          console.warn("Html5Qrcode stop warning:", e);
        }
        try {
          scanner.clear();
        } catch {}
      }
      killAllTracks();
    };

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode(elementId);
        scannerInstance = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          async (decodedText) => {
            if (!isMounted) return;
            await stopScanner();
            onScanSuccessRef.current(decodedText);
          },
          () => {
            // Ignore routine frame scan failures
          }
        );

        if (!isMounted) {
          await stopScanner();
          return;
        }

        setIsStarting(false);
      } catch {
        if (isMounted) {
          setError("Gagal mengakses kamera. Pastikan Anda telah memberikan izin kamera.");
          setIsStarting(false);
        }
        killAllTracks();
      }
    };

    startScanner();

    const handleUnload = () => {
      killAllTracks();
    };

    window.addEventListener("pagehide", handleUnload);
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      isMounted = false;
      if (navigator?.mediaDevices && originalGetUserMedia) {
        navigator.mediaDevices.getUserMedia = originalGetUserMedia;
      }
      window.removeEventListener("pagehide", handleUnload);
      window.removeEventListener("beforeunload", handleUnload);
      stopScanner();
    };
  }, [elementId]);

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

      <div id={elementId} className="w-full"></div>

      {/* Target Box Overlay */}
      {!isStarting && !error && (
        <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40 z-20">
          <div className="w-full h-full border-2 border-primary border-dashed opacity-70"></div>
        </div>
      )}
    </div>
  );
}
