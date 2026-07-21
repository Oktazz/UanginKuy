"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"

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

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    options: {
      data: {
        // Full name defaults to the first part of the email for now
        full_name: (formData.get("email") as string).split("@")[0],
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
