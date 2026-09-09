"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
} from "lucide-react";

import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Button } from "@/components/ui/button";
import { MAX_WASTE_IMAGE_BYTES, WASTE_IMAGE_MIME_TYPES, type WasteSortResult } from "@/lib/waste-sort";

type ApiResponse =
  | { success: true; data: WasteSortResult }
  | { success: false; error: string };

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

const COMPRESS_THRESHOLD_BYTES = 300 * 1024; // 300 KB

export function WasteSortClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<WasteSortResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  const replacePreview = (nextFile: File | null) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const nextUrl = nextFile ? URL.createObjectURL(nextFile) : null;
    previewUrlRef.current = nextUrl;
    setPreviewUrl(nextUrl);
  };

  const compressImage = (source: File, maxPx = 1920, quality = 0.8): Promise<File> =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(source);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width > maxPx || height > maxPx) {
          if (width >= height) {
            height = Math.round((height / width) * maxPx);
            width = maxPx;
          } else {
            width = Math.round((width / height) * maxPx);
            height = maxPx;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas tidak tersedia."));
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Kompresi gagal."));
            const nextName = source.name.replace(/\.[^.]+$/, ".webp");
            resolve(new File([blob], nextName, { type: blob.type || "image/webp" }));
          },
          "image/webp",
          quality,
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Gagal memuat gambar."));
      };
      img.src = url;
    });

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
        processedFile = await compressImage(nextFile);
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

  const analyze = async () => {
    if (!file || isLoading || isCompressing) return;
    setError(null);
    setResult(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.set("image", file);
      const response = await fetch("/api/ai/sort", { method: "POST", body: formData });
      const payload = (await response.json()) as ApiResponse;
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

  const chooseAnother = () => {
    setFile(null);
    replacePreview(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    inputRef.current?.click();
  };

  const status = result ? statusPresentation[result.status] : null;
  const StatusIcon = status?.icon;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
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

        <input
          ref={inputRef}
          id="waste-photo"
          type="file"
          accept={WASTE_IMAGE_MIME_TYPES.join(",")}
          capture="environment"
          className="sr-only"
          aria-label="Pilih foto sampah"
          disabled={isCompressing || isLoading}
          onChange={(event) => selectFile(event.target.files?.[0])}
        />

        {isCompressing ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-primary/25 bg-primary/[0.035] px-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
            <span className="mt-4 font-bold text-gray-900">Mengompresi foto...</span>
            <span className="mt-1 text-sm text-gray-500">Mengubah ke format WebP hemat kuota</span>
          </div>
        ) : !previewUrl ? (
          <label
            htmlFor="waste-photo"
            className="group flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-primary/25 bg-primary/[0.035] px-6 text-center transition-colors hover:border-primary/50 hover:bg-primary/[0.07] focus-within:ring-4 focus-within:ring-primary/10"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 transition-transform group-hover:-translate-y-1 motion-reduce:transform-none">
              <ImagePlus size={30} aria-hidden="true" />
            </span>
            <span className="mt-5 font-bold text-gray-900">Ambil atau pilih foto</span>
            <span className="mt-2 text-sm text-gray-500">JPG, PNG, atau WebP · otomatis dioptimalkan</span>
          </label>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-gray-950">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Pratinjau sampah yang akan dianalisis" className="aspect-[4/3] w-full object-contain" />
          </div>
        )}

        <ErrorAlert message={error} className="mt-4" />

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          {file && (
            <Button
              type="button"
              variant="outline"
              onClick={chooseAnother}
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
                      <li key={step} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-extrabold text-primary-dark">{index + 1}</span>{step}</li>
                    ))}
                  </ol>
                </article>
              ))}
            </div>

            {result.needsRetake ? (
              <Button
              type="button"
              onClick={chooseAnother}
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
    </div>
  );
}
