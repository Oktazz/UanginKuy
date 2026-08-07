"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import type { ResetPasswordState } from "./state";

const ResetPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Masukkan alamat email yang valid."),
});

const RESET_REQUEST_MESSAGE =
  "Jika email terdaftar, tautan pemulihan akan segera dikirim.";

export async function requestPasswordReset(
  _previousState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = ResetPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Alamat email tidak valid.",
    };
  }

  let siteUrl: URL;
  try {
    const configuredSiteUrl =
      process.env.SITE_URL ??
      (process.env.NODE_ENV === "production"
        ? undefined
        : "http://localhost:3000");

    if (!configuredSiteUrl) throw new Error("SITE_URL is not configured");
    siteUrl = new URL(configuredSiteUrl);
  } catch {
    return {
      status: "error",
      message:
        "Layanan pemulihan sedang tidak tersedia. Silakan coba lagi nanti.",
    };
  }

  const redirectUrl = new URL("/auth/confirm", siteUrl);
  redirectUrl.searchParams.set("next", "/set-password");

  const supabase = await createClient(await cookies());
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: redirectUrl.toString(),
  });

  return { status: "success", message: RESET_REQUEST_MESSAGE };
}
