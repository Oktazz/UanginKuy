"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { completeOnboarding } from "./actions"
import { Leaf, Upload, UserRound } from "lucide-react"

// A selection of DiceBear styles
const AVATAR_TEMPLATES = [
  "https://api.dicebear.com/9.x/avataaars/svg?seed=UanginKuy1&backgroundColor=b6e3f4",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=UanginKuy2&backgroundColor=c0aede",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=UanginKuy3&backgroundColor=ffdfbf",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=UanginKuy4&backgroundColor=d1d4f9",
  "https://api.dicebear.com/9.x/bottts/svg?seed=Robot1&backgroundColor=b6e3f4",
]

export default function OnboardingPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const [selectedAvatar, setSelectedAvatar] = useState<string>(AVATAR_TEMPLATES[0])
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setSelectedAvatar("") // Clear template selection
      setIsUploading(true)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-8 rounded-xl bg-surface p-8 shadow-sm">
        {/* Header */}
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Leaf className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Lengkapi Profil Anda
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Satu langkah lagi untuk mulai mengelola sampah Anda
          </p>
        </div>

        {/* Error Message */}
        {searchParams?.error && (
          <div className="rounded-md bg-error/10 p-4">
            <p className="text-sm text-center text-error">{searchParams.error}</p>
          </div>
        )}

        {/* Form */}
        <form className="mt-8 space-y-6" action={completeOnboarding}>
          
          {/* Avatar Selection */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Foto Profil</label>
            
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              {/* Preview */}
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-primary/20 bg-gray-100">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                ) : selectedAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedAvatar} alt="Template Avatar" className="h-full w-full object-cover" />
                ) : (
                  <UserRound className="h-full w-full p-4 text-gray-400" />
                )}
              </div>

              <div className="flex-1 space-y-4">
                {/* File Upload Option */}
                <div>
                  <label htmlFor="avatar_file" className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
                    <Upload className="h-4 w-4" />
                    Unggah Foto (Opsional)
                  </label>
                  <input
                    id="avatar_file"
                    name="avatar_file"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                </div>
                
                {/* Hidden input to pass selected template URL */}
                <input type="hidden" name="avatar_template_url" value={selectedAvatar} />

                {/* Templates Option */}
                <div>
                  <p className="mb-2 text-xs text-gray-500">Atau pilih avatar default:</p>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_TEMPLATES.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setSelectedAvatar(url)
                          setPreviewUrl(null)
                          setIsUploading(false)
                          // Clear file input manually
                          const fileInput = document.getElementById("avatar_file") as HTMLInputElement
                          if (fileInput) fileInput.value = ""
                        }}
                        className={`h-10 w-10 overflow-hidden rounded-full border-2 transition-all ${
                          selectedAvatar === url && !isUploading
                            ? "border-primary scale-110 shadow-sm"
                            : "border-transparent hover:scale-105"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Template ${i + 1}`} className="h-full w-full" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nama Lengkap
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Cth: Budi Santoso"
              />
            </div>
            
            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
                Nomor Handphone / WhatsApp
              </label>
              <Input
                id="phone_number"
                name="phone_number"
                type="tel"
                required
                placeholder="Cth: 081234567890"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Alamat Lengkap
              </label>
              <Textarea
                id="address"
                name="address"
                required
                placeholder="Masukkan alamat lengkap rumah / lokasi penjemputan Anda..."
              />
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full">
              Simpan & Lanjutkan
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
