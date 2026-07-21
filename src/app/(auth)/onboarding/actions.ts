"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"

export async function completeOnboarding(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect("/login")
  }

  const name = formData.get("name") as string
  const phoneNumber = formData.get("phone_number") as string
  const address = formData.get("address") as string
  const avatarFile = formData.get("avatar_file") as File | null
  const avatarTemplateUrl = formData.get("avatar_template_url") as string

  let avatarUrl = avatarTemplateUrl || null

  // If user uploaded a file, upload it to Supabase Storage
  if (avatarFile && avatarFile.size > 0) {
    const fileExt = avatarFile.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('public-assets')
      .upload(filePath, avatarFile, {
        cacheControl: '3600',
        upsert: true
      })

    if (!uploadError && uploadData) {
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('public-assets')
        .getPublicUrl(filePath)
      
      avatarUrl = publicUrl
    }
  }

  // Update public.profiles
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      name,
      phone_number: phoneNumber,
      address,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (updateError) {
    redirect(`/onboarding?error=${encodeURIComponent(updateError.message)}`)
  }

  revalidatePath("/", "layout")
  redirect("/dashboard")
}
