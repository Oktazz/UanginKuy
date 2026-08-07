import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const code = request.nextUrl.searchParams.get("code");
  const requestedNext = request.nextUrl.searchParams.get("next");
  const redirectUrl = request.nextUrl.clone();

  redirectUrl.search = "";

  const supabase = await createClient(await cookies());

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (!error) {
      if (type === "invite" || type === "recovery") {
        redirectUrl.pathname = "/set-password";
      } else if (type === "signup") {
        redirectUrl.pathname = "/dashboard";
      } else if (type === "email_change") {
        redirectUrl.pathname = "/profile/edit";
        redirectUrl.searchParams.set("success", "Email berhasil diperbarui.");
      } else {
        redirectUrl.pathname = "/dashboard";
      }
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      redirectUrl.pathname =
        requestedNext === "/set-password" ? requestedNext : "/dashboard";
      return NextResponse.redirect(redirectUrl);
    }
  }

  redirectUrl.pathname = "/login";
  redirectUrl.searchParams.set(
    "error",
    "Tautan autentikasi tidak valid atau sudah kedaluwarsa.",
  );
  return NextResponse.redirect(redirectUrl);
}
