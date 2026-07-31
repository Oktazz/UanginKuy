"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { z } from "zod"

const SignupSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(100, "Nama maksimal 100 karakter."),
  email: z.string().trim().toLowerCase().email("Alamat email tidak valid."),
  password: z.string().min(6, "Kata sandi minimal 6 karakter."),
})

export async function login(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  // type-casting here for convenience
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    // You could return an error object here to show in the UI, 
    // but redirecting with an error param is a simple pattern.
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath("/", "layout")
  redirect("/dashboard")
}

export async function signup(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const parsed = SignupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    redirect(`/register?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Data registrasi tidak valid.")}`)
  }

  const data = {
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.name,
      },
    }
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect(`/register?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath("/", "layout")
  redirect("/onboarding")
}

export async function logout() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  
  await supabase.auth.signOut()
  
  revalidatePath("/", "layout")
  redirect("/login")
}
