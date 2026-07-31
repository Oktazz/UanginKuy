"use client"

import { useEffect, useState } from "react"
import { Camera, Trash2 } from "lucide-react"
import { removeAvatar, uploadAvatar } from "./actions"

export function AvatarEditor({ avatarUrl, name }: { avatarUrl: string | null; name: string }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

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
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={uploadAvatar} className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white transition hover:bg-primary-dark">
              <Camera size={15} />
              Pilih foto
              <input
                className="sr-only"
                type="file"
                name="avatar"
                accept="image/jpeg,image/png,image/webp"
                required
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (previewUrl) URL.revokeObjectURL(previewUrl)
                  setPreviewUrl(file ? URL.createObjectURL(file) : null)
                }}
              />
            </label>
            {previewUrl && (
              <button type="submit" className="rounded-xl border border-primary px-4 py-2 text-xs font-bold text-primary hover:bg-primary/5">
                Simpan
              </button>
            )}
          </form>
          {avatarUrl && (
            <form action={removeAvatar}>
              <button type="submit" className="inline-flex items-center gap-2 rounded-xl border border-error/30 px-4 py-2.5 text-xs font-bold text-error hover:bg-error/5">
                <Trash2 size={15} />
                Hapus
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
