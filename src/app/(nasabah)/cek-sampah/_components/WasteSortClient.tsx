"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Camera,
  CheckCircle2,
  ImagePlus,
  Loader2,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Split,
  X,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Button } from "@/components/ui/button";
import { MAX_WASTE_IMAGE_BYTES, WASTE_IMAGE_MIME_TYPES, type WasteSortResult } from "@/lib/waste-sort";
import { cn } from "@/lib/utils";
import { compressImageBrowser, COMPRESS_THRESHOLD_BYTES } from "@/services/client-image.service";
import type { ApiResponse } from "@/types/api";

const confidenceLabel = {
  high: "Keyakinan tinggi",
  medium: "Keyakinan sedang",
  low: "Keyakinan rendah",
} as const;

const statusPresentation = {
  accepted: {
    title: "Siap dipilah",
    className: "border-primary/20 bg-primary/5 text-primary-dark",
    icon: CheckCircle2,
  },
  needs_separation: {
    title: "Perlu dipisahkan",
    className: "border-amber-200 bg-amber-50 text-amber-800",
    icon: Split,
  },
  unsupported: {
    title: "Kategori belum tersedia",
    className: "border-gray-200 bg-gray-50 text-gray-700",
    icon: AlertCircle,
  },
  uncertain: {
    title: "Perlu foto ulang",
    className: "border-orange-200 bg-orange-50 text-orange-800",
    icon: RefreshCw,
  },
} as const;

function isMobileDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isTouch = (navigator.maxTouchPoints || 0) > 1;
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isIPadOS = /Macintosh/i.test(ua) && isTouch;
  return isMobileUA || isIPadOS;
}

export function WasteSortClient() {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<WasteSortResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Dialog states
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const closeCameraModal = useCallback(() => {
    stopCameraStream();
    setIsCameraOpen(false);
    setCameraError(null);
    setIsStartingCamera(false);
  }, [stopCameraStream]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      stopCameraStream();
    };
  }, [stopCameraStream]);

  const replacePreview = (nextFile: File | null) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const nextUrl = nextFile ? URL.createObjectURL(nextFile) : null;
    previewUrlRef.current = nextUrl;
    setPreviewUrl(nextUrl);
  };

  const selectFile = async (nextFile: File | undefined) => {
    setResult(null);
    setError(null);
    if (!nextFile) {
      setFile(null);
      replacePreview(null);
      return;
    }
    if (!WASTE_IMAGE_MIME_TYPES.includes(nextFile.type as (typeof WASTE_IMAGE_MIME_TYPES)[number])) {
      setFile(null);
      replacePreview(null);
      setError("Gunakan foto JPG, PNG, atau WebP.");
      return;
    }

    let processedFile = nextFile;
    // Kompresi ke format WebP jika ukuran > 300 KB atau format gambar belum WebP
    if (nextFile.size > COMPRESS_THRESHOLD_BYTES || nextFile.type !== "image/webp") {
      setIsCompressing(true);
      try {
        processedFile = await compressImageBrowser(nextFile);
      } catch {
        setFile(null);
        replacePreview(null);
        setError("Gagal mengompresi foto. Coba gunakan foto lain.");
        setIsCompressing(false);
        return;
      } finally {
        setIsCompressing(false);
      }

      if (processedFile.size > MAX_WASTE_IMAGE_BYTES) {
        setFile(null);
        replacePreview(null);
        setError("Ukuran foto terlalu besar bahkan setelah kompresi. Coba foto ulang.");
        return;
      }
    }

    setFile(processedFile);
    replacePreview(processedFile);
  };

  const startCamera = useCallback(async (mode: "environment" | "user" = facingMode) => {
    setIsStartingCamera(true);
    setCameraError(null);
    stopCameraStream();

    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("Kamera tidak didukung di browser ini.");
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch {
          // Play was prevented or interrupted
        }
      }

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        setHasMultipleCameras(videoInputs.length > 1);
      } catch {
        // Enumerate devices not permitted or failed
      }
    } catch (err) {
      const isNotAllowed = err instanceof Error && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError");
      const message = isNotAllowed
        ? "Izin akses kamera ditolak. Berikan izin di browser Anda atau pilih foto dari file."
        : "Kamera tidak dapat diakses atau tidak ditemukan. Silakan pilih foto dari file.";
      setCameraError(message);
    } finally {
      setIsStartingCamera(false);
    }
  }, [facingMode, stopCameraStream]);

  const toggleCameraFacing = async () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    await startCamera(nextMode);
  };

  const captureFromCamera = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const capturedFile = new File(
            [blob],
            `kamera-sampah-${Date.now()}.jpg`,
            { type: "image/jpeg" }
          );
          closeCameraModal();
          selectFile(capturedFile);
        }
      },
      "image/jpeg",
      0.92
    );
  };

  const handleCameraClick = () => {
    setIsSourceModalOpen(false);
    if (isMobileDevice()) {
      cameraInputRef.current?.click();
      return;
    }

    if (
      typeof navigator !== "undefined" &&
      typeof navigator.mediaDevices?.getUserMedia === "function"
    ) {
      setIsCameraOpen(true);
      startCamera();
      return;
    }

    cameraInputRef.current?.click();
  };

  const handleFileClick = () => {
    setIsSourceModalOpen(false);
    fileInputRef.current?.click();
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) {
      selectFile(droppedFile);
    }
  };

  const analyze = async () => {
    if (!file || isLoading || isCompressing) return;
    setError(null);
    setResult(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.set("image", file);
      const response = await fetch("/api/ai/sort", { method: "POST", body: formData });
      const payload = (await response.json()) as ApiResponse<WasteSortResult>;
      if (!response.ok || !payload.success) {
        throw new Error(payload.success ? "Analisis belum berhasil." : payload.error);
      }
      setResult(payload.data);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Analisis belum berhasil. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const status = result ? statusPresentation[result.status] : null;
  const StatusIcon = status?.icon;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
      {/* Hidden Inputs for Native File and Camera */}
      <input
        ref={cameraInputRef}
        id="waste-camera-input"
        type="file"
        accept={WASTE_IMAGE_MIME_TYPES.join(",")}
        capture="environment"
        className="sr-only"
        aria-label="Ambil foto dari kamera"
        disabled={isCompressing || isLoading}
        onChange={(event) => {
          selectFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <input
        ref={fileInputRef}
        id="waste-file-input"
        type="file"
        accept={WASTE_IMAGE_MIME_TYPES.join(",")}
        className="sr-only"
        aria-label="Pilih foto sampah"
        disabled={isCompressing || isLoading}
        onChange={(event) => {
          selectFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <section className="rounded-3xl border border-gray-100 bg-surface p-5 shadow-sm sm:p-7">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Camera size={22} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">Foto sampahmu</h2>
            <p className="mt-1 text-sm leading-6 text-gray-500">Ambil foto dalam cahaya terang. Maksimal tiga jenis sampah dalam satu foto.</p>
          </div>
        </div>

        {isCompressing ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-primary/25 bg-primary/[0.035] px-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
            <span className="mt-4 font-bold text-gray-900">Mengompresi foto...</span>
            <span className="mt-1 text-sm text-gray-500">Mengubah ke format WebP hemat kuota</span>
          </div>
        ) : !previewUrl ? (
          /* Initial Choice Area: Camera or File with Drag & Drop */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative flex min-h-72 flex-col items-center justify-center rounded-3xl border-2 border-dashed px-4 py-8 text-center transition-all sm:px-8",
              isDragging
                ? "border-primary bg-primary/[0.08] ring-4 ring-primary/10 scale-[1.01]"
                : "border-primary/25 bg-primary/[0.03] hover:border-primary/40 hover:bg-primary/[0.05]"
            )}
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
              <ScanSearch size={28} aria-hidden="true" />
            </div>

            <h3 className="text-base font-extrabold text-gray-900 sm:text-lg">
              Pilih Metode Pengambilan Foto
            </h3>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-gray-500 sm:text-sm">
              Gunakan kamera langsung atau pilih file foto sampah dari perangkatmu
            </p>

            {/* Action Buttons for Mobile to Desktop */}
            <div className="mt-6 grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleCameraClick}
                disabled={isLoading || isCompressing}
                className="group flex min-h-14 items-center gap-3.5 rounded-2xl border-2 border-primary/20 bg-white p-3.5 text-left shadow-sm transition-all hover:border-primary hover:bg-primary/5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:flex-col sm:items-center sm:p-5 sm:text-center"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/20 transition-transform group-hover:scale-105 sm:h-12 sm:w-12">
                  <Camera size={22} aria-hidden="true" />
                </span>
                <div>
                  <span className="block text-sm font-extrabold text-gray-900 group-hover:text-primary">
                    Ambil dari Kamera
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-500">
                    Foto langsung dengan kamera
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={handleFileClick}
                disabled={isLoading || isCompressing}
                className="group flex min-h-14 items-center gap-3.5 rounded-2xl border-2 border-gray-200 bg-white p-3.5 text-left shadow-sm transition-all hover:border-primary hover:bg-primary/5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:flex-col sm:items-center sm:p-5 sm:text-center"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition-colors group-hover:bg-primary group-hover:text-white sm:h-12 sm:w-12">
                  <ImagePlus size={22} aria-hidden="true" />
                </span>
                <div>
                  <span className="block text-sm font-extrabold text-gray-900 group-hover:text-primary">
                    Pilih dari File
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-500">
                    Dari galeri atau folder
                  </span>
                </div>
              </button>
            </div>

            <div className="mt-5 space-y-1">
              <p className="hidden text-xs text-gray-500 sm:block">
                atau seret dan lepas file foto ke area ini
              </p>
              <p className="text-[11px] text-gray-500 sm:text-xs">
                JPG, PNG, atau WebP · Otomatis dioptimalkan
              </p>
            </div>
          </div>
        ) : (
          <div className="relative group overflow-hidden rounded-3xl border border-gray-200 bg-gray-950">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Pratinjau sampah yang akan dianalisis" className="aspect-[4/3] w-full object-contain" />
            <button
              type="button"
              onClick={() => setIsSourceModalOpen(true)}
              disabled={isLoading || isCompressing}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-xl bg-black/70 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <RefreshCw size={13} aria-hidden="true" /> Ganti foto
            </button>
          </div>
        )}

        <ErrorAlert message={error} className="mt-4" />

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          {file && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSourceModalOpen(true)}
              disabled={isLoading || isCompressing}
              className="min-h-12 flex-1 rounded-2xl border-gray-200 px-5 font-bold text-gray-700 hover:bg-gray-50 focus-visible:ring-primary/15 disabled:opacity-50"
            >
              Pilih foto lain
            </Button>
          )}
          <Button
            type="button"
            onClick={analyze}
            disabled={!file || isCompressing}
            loading={isLoading}
            loadingLabel="Menganalisis..."
            className="min-h-12 flex-1 rounded-2xl bg-primary px-5 font-bold text-white shadow-md hover:bg-primary-dark focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ScanSearch className="mr-2" size={19} />
            Analisis foto
          </Button>
        </div>

        <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-gray-500">
          <ShieldCheck size={15} className="text-primary" aria-hidden="true" />
          Foto diproses sementara dan tidak disimpan.
        </p>
      </section>

      <section aria-live="polite" aria-busy={isLoading} className="min-h-[25rem] rounded-3xl border border-gray-100 bg-surface p-5 shadow-sm sm:p-7">
        {!result ? (
          <div className="flex h-full min-h-[22rem] flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/50 text-primary">
              <Sparkles size={28} aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-xl font-extrabold text-gray-900">Panduan akan muncul di sini</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">Kami akan membantu mengenali kategori dan cara menyiapkannya. Harga serta saldo final tetap mengikuti hasil timbang kurir.</p>
          </div>
        ) : (
          <div>
            {status && StatusIcon && (
              <div className={`flex items-start gap-3 rounded-2xl border p-4 ${status.className}`}>
                <StatusIcon className="mt-0.5 shrink-0" size={20} aria-hidden="true" />
                <div>
                  <p className="font-extrabold">{status.title}</p>
                  <p className="mt-1 text-sm leading-6">{result.overallAdvice}</p>
                  {result.retakeReason && <p className="mt-1 text-sm font-semibold">{result.retakeReason}</p>}
                </div>
              </div>
            )}

            <div className="mt-5 space-y-4">
              {result.items.map((item) => (
                <article key={item.categoryId} className="rounded-2xl border border-gray-200 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-primary">{item.materialGroup}</p>
                      <h3 className="mt-1 text-lg font-extrabold text-gray-900">{item.name}</h3>
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary-dark">{confidenceLabel[item.confidence]}</span>
                  </div>
                  {item.issues.length > 0 && (
                    <ul className="mt-4 space-y-2 text-sm text-amber-800">
                      {item.issues.map((issue) => <li key={issue} className="flex gap-2"><AlertCircle className="mt-0.5 shrink-0" size={16} />{issue}</li>)}
                    </ul>
                  )}
                  <h4 className="mt-5 text-sm font-extrabold text-gray-900">Sebelum dijemput</h4>
                  <ol className="mt-3 space-y-2 text-sm leading-6 text-gray-600">
                    {item.preparationSteps.map((step, index) => (
                      <li key={step} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-extrabold text-white">{index + 1}</span>{step}</li>
                    ))}
                  </ol>
                </article>
              ))}
            </div>

            {result.needsRetake ? (
              <Button
                type="button"
                onClick={() => setIsSourceModalOpen(true)}
                className="mt-5 flex min-h-12 w-full items-center justify-center rounded-2xl bg-gray-900 px-5 font-bold text-white hover:bg-gray-800 focus-visible:ring-gray-300"
              >
                <RefreshCw className="mr-2" size={18} /> Foto ulang
              </Button>
            ) : (
              <Link href="/booking" className="mt-5 flex min-h-12 w-full items-center justify-center rounded-2xl bg-primary px-5 font-bold text-white shadow-md hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25">
                Buat jadwal jemput <ArrowRight className="ml-2" size={18} />
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Modal Dialog: Choose Source (Camera or File) */}
      <Dialog open={isSourceModalOpen} onOpenChange={setIsSourceModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-gray-900">
              Pilih Sumber Foto
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Pilih cara untuk mengambil atau mengganti foto sampah yang ingin dianalisis.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleCameraClick}
              className="group flex items-center gap-3.5 rounded-2xl border-2 border-primary/20 bg-white p-4 text-left shadow-sm transition-all hover:border-primary hover:bg-primary/5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:flex-col sm:items-center sm:p-5 sm:text-center"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/20 transition-transform group-hover:scale-105 sm:h-12 sm:w-12">
                <Camera size={22} aria-hidden="true" />
              </span>
              <div>
                <span className="block text-sm font-extrabold text-gray-900 group-hover:text-primary">
                  Ambil dari Kamera
                </span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  Foto langsung dengan kamera
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleFileClick}
              className="group flex items-center gap-3.5 rounded-2xl border-2 border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-primary hover:bg-primary/5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:flex-col sm:items-center sm:p-5 sm:text-center"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition-colors group-hover:bg-primary group-hover:text-white sm:h-12 sm:w-12">
                <ImagePlus size={22} aria-hidden="true" />
              </span>
              <div>
                <span className="block text-sm font-extrabold text-gray-900 group-hover:text-primary">
                  Pilih dari File
                </span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  Dari galeri atau folder
                </span>
              </div>
            </button>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsSourceModalOpen(false)}
              className="rounded-xl text-gray-500 hover:text-gray-900"
            >
              Batal
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Dialog: Live Desktop Webcam Viewfinder */}
      <Dialog
        open={isCameraOpen}
        onOpenChange={(open) => {
          if (!open) closeCameraModal();
        }}
      >
        <DialogContent className="max-w-lg rounded-3xl p-5 sm:p-6" showCloseButton={false}>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-lg font-extrabold text-gray-900">
                <Camera size={20} className="text-primary" /> Kamera Langsung
              </DialogTitle>
              <button
                type="button"
                onClick={closeCameraModal}
                className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Tutup kamera"
              >
                <X size={20} />
              </button>
            </div>
            <DialogDescription className="text-xs text-gray-500">
              Posisikan sampah di depan kamera dengan pencahayaan yang cukup.
            </DialogDescription>
          </DialogHeader>

          <div className="relative mt-3 aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gray-950 flex items-center justify-center">
            {isStartingCamera && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-950/80 text-white">
                <Loader2 className="h-9 w-9 animate-spin text-primary" />
                <p className="mt-3 text-sm font-semibold">Mengaktifkan kamera...</p>
              </div>
            )}

            {cameraError ? (
              <div className="p-6 text-center text-white">
                <AlertCircle className="mx-auto h-12 w-12 text-amber-400" />
                <p className="mt-3 text-sm font-bold">{cameraError}</p>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <Button
                    type="button"
                    onClick={() => startCamera()}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <RefreshCw className="mr-1.5" size={15} /> Coba Lagi
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      closeCameraModal();
                      handleFileClick();
                    }}
                    className="bg-primary text-white hover:bg-primary-dark"
                  >
                    <ImagePlus className="mr-1.5" size={15} /> Pilih dari File
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />

                {/* Viewfinder Overlay Guide */}
                <div className="pointer-events-none absolute inset-6 flex items-center justify-center rounded-2xl border-2 border-dashed border-white/50">
                  <span className="rounded-full bg-black/50 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                    Arahkan ke sampah
                  </span>
                </div>
              </>
            )}
          </div>

          {!cameraError && (
            <div className="mt-4 flex items-center gap-2">
              {hasMultipleCameras && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={toggleCameraFacing}
                  disabled={isStartingCamera}
                  className="rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50"
                  title="Balik kamera depan/belakang"
                >
                  <RefreshCw size={17} />
                  <span className="hidden sm:inline ml-1.5">Balik Kamera</span>
                </Button>
              )}
              <Button
                type="button"
                onClick={captureFromCamera}
                disabled={isStartingCamera}
                className="min-h-12 flex-1 rounded-2xl bg-primary px-5 font-bold text-white shadow-md hover:bg-primary-dark focus-visible:ring-primary/25"
              >
                <Camera className="mr-2" size={19} />
                Jepret Foto
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={closeCameraModal}
                className="min-h-12 rounded-2xl border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Batal
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
