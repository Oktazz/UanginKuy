"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { z } from "zod"
import { createAdminClient } from "@/utils/supabase/admin"
import { createClient } from "@/utils/supabase/server"

const MAX_AVATAR_SIZE = 2 * 1024 * 1024
const ALLOWED_AVATAR_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}
const ProfileSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(100, "Nama maksimal 100 karakter."),
  email: z.string().trim().toLowerCase().email("Alamat email tidak valid."),
})

async function requireNasabah() {
  const supabase = await createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, avatar_url")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "nasabah") redirect("/dashboard")
  return { supabase, user, profile }
}

function getOwnedAvatarPath(publicUrl: string | null, userId: string) {
  if (!publicUrl) return null
  const marker = "/public-assets/"
  const markerIndex = publicUrl.indexOf(marker)
  if (markerIndex === -1) return null

  const path = decodeURIComponent(publicUrl.slice(markerIndex + marker.length))
  return path.startsWith(`avatars/${userId}/`) ? path : null
}

export async function uploadAvatar(formData: FormData) {
  const file = formData.get("avatar")

  if (!(file instanceof File) || file.size === 0) {
    redirect("/profile/edit?error=Silakan%20pilih%20foto.")
  }

  const extension = ALLOWED_AVATAR_TYPES[file.type]
  if (!extension) {
    redirect("/profile/edit?error=Foto%20harus%20berformat%20JPG%2C%20PNG%2C%20atau%20WebP.")
  }
  if (file.size > MAX_AVATAR_SIZE) {
    redirect("/profile/edit?error=Ukuran%20foto%20maksimal%202%20MB.")
  }

  const { supabase, user, profile } = await requireNasabah()
  const filePath = `avatars/${user.id}/${randomUUID()}.${extension}`
  const { error: uploadError } = await supabase.storage
    .from("public-assets")
    .upload(filePath, file, { cacheControl: "3600", upsert: false })

  if (uploadError) {
    redirect(`/profile/edit?error=${encodeURIComponent("Gagal mengunggah foto profil.")}`)
  }

  const { data: { publicUrl } } = supabase.storage
    .from("public-assets")
    .getPublicUrl(filePath)

  const admin = createAdminClient()
  const { error: updateError } = await admin
    .from("profiles")
    .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .eq("role", "nasabah")

  if (updateError) {
    await supabase.storage.from("public-assets").remove([filePath])
    redirect(`/profile/edit?error=${encodeURIComponent("Gagal menyimpan foto profil.")}`)
  }

  const previousPath = getOwnedAvatarPath(profile.avatar_url, user.id)
  if (previousPath) {
    await supabase.storage.from("public-assets").remove([previousPath])
  }

  revalidatePath("/profile")
  redirect("/profile/edit?success=Foto%20profil%20berhasil%20diperbarui.")
}

export async function removeAvatar() {
  const { supabase, user, profile } = await requireNasabah()
  const admin = createAdminClient()
  const { error } = await admin
    .from("profiles")
    .update({ avatar_url: null, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .eq("role", "nasabah")

  if (error) {
    redirect(`/profile/edit?error=${encodeURIComponent("Gagal menghapus foto profil.")}`)
  }

  const previousPath = getOwnedAvatarPath(profile.avatar_url, user.id)
  if (previousPath) {
    await supabase.storage.from("public-assets").remove([previousPath])
  }

  revalidatePath("/profile")
  redirect("/profile/edit?success=Foto%20profil%20berhasil%20dihapus.")
}

export async function updateProfile(formData: FormData) {
  const parsed = ProfileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  })

  if (!parsed.success) {
    redirect(`/profile/edit?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Data profil tidak valid.")}`)
  }

  const { supabase, user } = await requireNasabah()
  const admin = createAdminClient()

  // Check if email is changing
  const newEmail = parsed.data.email.toLowerCase()
  const emailChanged = newEmail !== user.email?.toLowerCase()

  if (emailChanged) {
    // Require re-authentication: user must provide current password
    const currentPassword = formData.get("currentPassword") as string
    if (!currentPassword) {
      redirect(`/profile/edit?error=${encodeURIComponent("Silakan masukkan kata sandi saat ini untuk mengubah email.")}`)
    }

    // Verify current password before allowing email change
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email!.toLowerCase(),
      password: currentPassword,
    })

    if (authError) {
      revalidatePath("/profile")
      redirect(`/profile/edit?error=${encodeURIComponent("Kata sandi salah. Gagal memperbarui email.")}`)
    }
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ name: parsed.data.name, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .eq("role", "nasabah")

  if (profileError) {
    redirect(`/profile/edit?error=${encodeURIComponent("Gagal memperbarui nama.")}`)
  }

  if (emailChanged) {
    // Update user email first
    const { error: emailError } = await supabase.auth.updateUser({ email: newEmail })
    if (emailError) {
      revalidatePath("/profile")
      redirect(`/profile/edit?error=${encodeURIComponent(`Nama tersimpan, tetapi email gagal diperbarui: ${emailError.message}`)}`)
    }

    // Note: Email verification link should be sent by Supabase automatically
    // or the user will receive it via their email on next auth flow
    revalidatePath("/profile")
    redirect(`/profile/edit?success=${encodeURIComponent("Nama tersimpan. Email baru berhasil diupdate. Silakan cek email untuk verifikasi.")}`)
  }

  revalidatePath("/profile")
  redirect("/profile/edit?success=Profil%20berhasil%20diperbarui.")
}
