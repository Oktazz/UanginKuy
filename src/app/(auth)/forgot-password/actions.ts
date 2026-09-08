"use server";

import { cookies, headers } from "next/headers";
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
    let configuredSiteUrl =
      process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;

    if (!configuredSiteUrl && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      configuredSiteUrl = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    } else if (!configuredSiteUrl && process.env.VERCEL_URL) {
      configuredSiteUrl = `https://${process.env.VERCEL_URL}`;
    }

    if (!configuredSiteUrl) {
      try {
        const headerList = await headers();
        const host =
          headerList.get("x-forwarded-host") ?? headerList.get("host");
        const proto =
          headerList.get("x-forwarded-proto") ??
          (host?.includes("localhost") ? "http" : "https");
        if (host) {
          configuredSiteUrl = `${proto}://${host}`;
        }
      } catch {
        // headers() might not be available in non-request contexts
      }
    }

    if (!configuredSiteUrl && process.env.NODE_ENV !== "production") {
      configuredSiteUrl = "http://localhost:3000";
    }

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
