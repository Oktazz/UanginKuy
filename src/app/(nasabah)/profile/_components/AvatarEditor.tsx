"use client"

import { useEffect, useRef, useState } from "react"
import { useFormStatus } from "react-dom"
import { Camera, Trash2, Loader2 } from "lucide-react"
import { removeAvatar, uploadAvatar } from "../actions"
import { compressImageBrowser, COMPRESS_THRESHOLD_BYTES } from "@/services/client-image.service"

const MAX_FILE_SIZE = 2 * 1024 * 1024
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"]

function SaveButton({ isCompressing }: { isCompressing?: boolean }) {
  const { pending } = useFormStatus()
  const disabled = pending || isCompressing
  return (
    <button
      type="submit"
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-xl border border-primary px-4 py-2 text-xs font-bold text-primary transition hover:bg-primary/5 disabled:opacity-50"
    >
      {(pending || isCompressing) && <Loader2 size={13} className="animate-spin" />}
      {isCompressing ? "Mengompresi..." : pending ? "Menyimpan..." : "Simpan"}
    </button>
  )
}

function RemoveButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-xl border border-error/30 px-4 py-2.5 text-xs font-bold text-error transition hover:bg-error/5 disabled:opacity-50"
    >
      {pending ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
      {pending ? "Menghapus..." : "Hapus"}
    </button>
  )
}

export function AvatarEditor({ avatarUrl, name }: { avatarUrl: string | null; name: string }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [processedFile, setProcessedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isCompressing, setIsCompressing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const file = event.target.files?.[0]

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }

    if (!file) {
      setProcessedFile(null)
      return
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setError("Format foto harus JPG, PNG, atau WebP.")
      setProcessedFile(null)
      if (inputRef.current) inputRef.current.value = ""
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Ukuran foto maksimal 2 MB.")
      setProcessedFile(null)
      if (inputRef.current) inputRef.current.value = ""
      return
    }

    let finalFile = file
    if (file.size > COMPRESS_THRESHOLD_BYTES || file.type !== "image/webp") {
      setIsCompressing(true)
      try {
        finalFile = await compressImageBrowser(file, { maxDimension: 512, quality: 0.85 })
      } catch {
        finalFile = file
      } finally {
        setIsCompressing(false)
      }
    }

    setProcessedFile(finalFile)
    setPreviewUrl(URL.createObjectURL(finalFile))
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-2xl font-extrabold text-white shadow-md">
        {previewUrl || avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl || avatarUrl || ""} alt={`Foto profil ${name}`} className="h-full w-full object-cover" />
        ) : (
          initials || "UK"
        )}
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-bold text-gray-900">Foto profil</p>
          <p className="mt-0.5 text-xs text-gray-500">JPG, PNG, atau WebP. Maksimal 2 MB.</p>
          {error && <p className="mt-1 text-xs font-semibold text-error">{error}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <form
            action={async (formData: FormData) => {
              if (processedFile) {
                formData.set("avatar", processedFile)
              }
              await uploadAvatar(formData)
            }}
            className="flex flex-wrap items-center gap-2"
          >
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white transition hover:bg-primary-dark">
              <Camera size={15} />
              Pilih foto
              <input
                ref={inputRef}
                className="sr-only"
                type="file"
                name="avatar"
                accept="image/jpeg,image/png,image/webp"
                required
                onChange={handleFileChange}
              />
            </label>
            {previewUrl && <SaveButton isCompressing={isCompressing} />}
          </form>
          {avatarUrl && (
            <form action={removeAvatar}>
              <RemoveButton />
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
