"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { cookies, headers } from "next/headers";
import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

const SignupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(100, "Nama maksimal 100 karakter."),
  email: z.string().trim().toLowerCase().email("Alamat email tidak valid."),
  password: z.string().min(6, "Kata sandi minimal 6 karakter."),
});

export async function login(formData: FormData) {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(
      `/login?error=${encodeURIComponent("Email atau kata sandi salah.")}`,
    );
  }

  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirect(
      `/login?error=${encodeURIComponent("Email atau kata sandi salah.")}`,
    );
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const parsed = SignupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(
      `/register?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Data registrasi tidak valid.")}`,
    );
  }

  const data = {
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.name,
      },
    },
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    redirect(`/register?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}

export async function signInWithGoogle() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  // Prioritaskan header request yang sedang aktif agar pengujian lokal tidak terlempar ke domain production
  let origin: string | null = null;
  try {
    const headerList = await headers();
    const originHeader = headerList.get("origin");
    if (originHeader) {
      origin = originHeader;
    } else {
      const host =
        headerList.get("x-forwarded-host") ?? headerList.get("host");
      const proto =
        headerList.get("x-forwarded-proto") ??
        (host?.includes("localhost") ? "http" : "https");
      if (host) {
        origin = `${proto}://${host}`;
      }
    }
  } catch {
    // headers() might not be available in non-request contexts
  }

  if (!origin) {
    origin =
      process.env.SITE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "http://localhost:3000");
  }

  origin = origin.replace(/\/$/, "");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/confirm?next=/dashboard`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    redirect(
      `/login?error=${encodeURIComponent("Gagal menghubungkan ke Google. Silakan coba lagi.")}`,
    );
  }

  if (data?.url) {
    redirect(data.url);
  }
}

