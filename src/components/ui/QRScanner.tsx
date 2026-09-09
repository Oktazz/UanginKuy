"use client";

import { useEffect, useState, useRef, useId, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { AlertCircle, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QRScanner({ onScanSuccess }: { onScanSuccess: (text: string) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  const rawId = useId().replace(/[:%]/g, "");
  const elementId = useRef(`qr-reader-${rawId}`).current;

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isMountedRef = useRef(true);
  const isBusyRef = useRef(false);
  const activeStreamsRef = useRef<Set<MediaStream>>(new Set());
  const onScanSuccessRef = useRef(onScanSuccess);
  onScanSuccessRef.current = onScanSuccess;

  const killAllTracks = useCallback(() => {
    activeStreamsRef.current.forEach((stream) => {
      try {
        stream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch {}
        });
      } catch {}
    });
    activeStreamsRef.current.clear();

    // Safety net: stop tracks on video elements in DOM without setting srcObject=null
    // (nulling srcObject aborts pending video.play() promises asynchronously)
    try {
      const el = document.getElementById(elementId);
      const videos = el ? el.querySelectorAll("video") : document.querySelectorAll("video");
      videos.forEach((video) => {
        const stream = video.srcObject as MediaStream | null;
        if (stream) {
          stream.getTracks().forEach((track) => {
            try {
              track.stop();
            } catch {}
          });
        }
      });
    } catch {}
  }, [elementId]);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
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

    try {
      const el = document.getElementById(elementId);
      if (el) {
        el.innerHTML = "";
      }
    } catch {}
  }, [elementId, killAllTracks]);

  const startScanner = useCallback(async () => {
    if (!isMountedRef.current) return;
    setIsStarting(true);
    setError(null);

    try {
      const el = document.getElementById(elementId);
      if (!el) {
        console.warn("Scanner element not found in DOM");
        return;
      }
      el.innerHTML = "";

      const scanner = new Html5Qrcode(elementId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          if (!isMountedRef.current) return;
          await stopScanner();
          onScanSuccessRef.current(decodedText);
        },
        () => {
          // Ignore routine frame scan failures
        }
      );

      if (!isMountedRef.current) {
        await stopScanner();
        return;
      }

      setIsStarting(false);
    } catch (err) {
      if (isMountedRef.current) {
        console.error("Scanner start error:", err);
        setError("Gagal mengakses kamera. Pastikan Anda telah memberikan izin kamera.");
        setIsStarting(false);
      }
      killAllTracks();
    }
  }, [elementId, stopScanner, killAllTracks]);

  const handleReset = useCallback(async () => {
    if (isBusyRef.current) return;
    isBusyRef.current = true;
    setIsResetting(true);
    setIsStarting(true);
    setError(null);

    try {
      await stopScanner();
      // Allow hardware camera driver brief moment to release before re-initializing
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (isMountedRef.current) {
        await startScanner();
      }
    } catch (e) {
      console.error("handleReset error:", e);
      if (isMountedRef.current) {
        setError("Gagal memulai ulang kamera.");
        setIsStarting(false);
      }
    } finally {
      isBusyRef.current = false;
      if (isMountedRef.current) {
        setIsResetting(false);
      }
    }
  }, [stopScanner, startScanner]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    isMountedRef.current = true;

    // Intercept getUserMedia so we directly track every camera stream requested
    const originalGetUserMedia = navigator?.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices);
    if (navigator?.mediaDevices && originalGetUserMedia) {
      navigator.mediaDevices.getUserMedia = async (constraints) => {
        const stream = await originalGetUserMedia(constraints);
        if (!isMountedRef.current) {
          stream.getTracks().forEach((track) => {
            try {
              track.stop();
            } catch {}
          });
        } else {
          activeStreamsRef.current.add(stream);
        }
        return stream;
      };
    }

    // Patch prototype.play() to catch asynchronous AbortError when video is stopped
    const originalPlay = HTMLMediaElement?.prototype?.play;
    if (originalPlay) {
      HTMLMediaElement.prototype.play = function (...args: unknown[]) {
        const pending = originalPlay.apply(this, args as never);
        if (pending && typeof pending.catch === "function") {
          pending.catch((error: unknown) => {
            if (error instanceof DOMException && error.name === "AbortError") return;
            throw error;
          });
        }
        return pending;
      };
    }

    const swallowMediaAbort = (event: PromiseRejectionEvent) => {
      const reason = event.reason as { name?: string } | null;
      if (reason && reason.name === "AbortError") {
        event.preventDefault();
      }
    };
    window.addEventListener("unhandledrejection", swallowMediaAbort);

    startScanner();

    const handleUnload = () => {
      killAllTracks();
    };

    window.addEventListener("pagehide", handleUnload);
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      isMountedRef.current = false;
      if (originalPlay) {
        HTMLMediaElement.prototype.play = originalPlay;
      }
      if (navigator?.mediaDevices && originalGetUserMedia) {
        navigator.mediaDevices.getUserMedia = originalGetUserMedia;
      }
      window.removeEventListener("unhandledrejection", swallowMediaAbort);
      window.removeEventListener("pagehide", handleUnload);
      window.removeEventListener("beforeunload", handleUnload);
      killAllTracks();
      stopScanner();
    };
  }, [startScanner, stopScanner, killAllTracks]);

  return (
    <div className="w-full max-w-sm mx-auto bg-surface rounded-3xl overflow-hidden shadow-sm border border-gray-100 relative aspect-square">
      {(isStarting || isResetting) && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10">
          <Loader2 size={32} className="animate-spin text-primary mb-3" />
          <p className="text-sm font-medium text-gray-500">
            {isResetting ? "Memuat ulang kamera..." : "Membuka kamera..."}
          </p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10 p-6 text-center">
          <AlertCircle size={40} className="text-error mb-3" />
          <p className="text-sm font-medium text-gray-700 mb-3">{error}</p>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-dark transition-colors shadow-sm"
          >
            Coba Lagi
          </button>
        </div>
      )}

      <div
        id={elementId}
        className="w-full h-full absolute inset-0 [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
      ></div>

      {/* Target Box Overlay */}
      {!isStarting && !isResetting && !error && (
        <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40 z-20">
          <div className="w-full h-full border-2 border-primary border-dashed opacity-70"></div>
        </div>
      )}

      {/* Reset camera button */}
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={handleReset}
        disabled={isResetting}
        loading={isResetting}
        loadingLabel=""
        className="absolute bottom-3 right-3 z-30 rounded-full bg-black/50 p-2.5 text-white backdrop-blur-sm hover:bg-black/70 active:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Reset kamera"
        title="Reset kamera"
      >
        <RotateCcw size={20} />
      </Button>
    </div>
  );
}
