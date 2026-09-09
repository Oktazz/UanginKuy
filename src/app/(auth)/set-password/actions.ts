"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";

const PasswordSchema = z
  .object({
    password: z.string().min(8, "Password minimal 8 karakter."),
    confirmation: z.string(),
  })
  .refine((value) => value.password === value.confirmation, {
    message: "Konfirmasi password tidak sama.",
    path: ["confirmation"],
  });

export async function getTranslatedPasswordError(error: {
  message: string;
  code?: string;
}): Promise<string> {
  const code = error.code?.toLowerCase();
  const message = error.message.toLowerCase();

  if (
    code === "same_password" ||
    message.includes("new password should be different") ||
    message.includes("same as the old password") ||
    message.includes("same_password")
  ) {
    return "Kata sandi baru harus berbeda dengan kata sandi lama.";
  }

  if (
    message.includes("at least 6 characters") ||
    message.includes("at least 8 characters") ||
    message.includes("password should be")
  ) {
    return "Kata sandi minimal 8 karakter.";
  }

  if (
    message.includes("session missing") ||
    message.includes("session expired") ||
    message.includes("jwt expired") ||
    message.includes("token has expired")
  ) {
    return "Sesi pemulihan telah kedaluwarsa. Silakan minta tautan baru.";
  }

  return error.message;
}

export async function setInvitedUserPassword(formData: FormData) {
  const parsed = PasswordSchema.safeParse({
    password: formData.get("password"),
    confirmation: formData.get("confirmation"),
  });

  if (!parsed.success) {
    redirect(
      `/set-password?error=${encodeURIComponent(
        parsed.error.issues[0]?.message ?? "Password tidak valid.",
      )}`,
    );
  }

  const supabase = await createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    const localizedError = await getTranslatedPasswordError(error);
    redirect(`/set-password?error=${encodeURIComponent(localizedError)}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin" || profile?.role === "super_admin") {
    redirect("/admin/dashboard");
  }
  if (profile?.role === "kurir") redirect("/kurir/dashboard");
  redirect("/dashboard");
}
