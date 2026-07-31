import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const redirectUrl = request.nextUrl.clone();

  redirectUrl.search = "";

  if (tokenHash && type) {
    const supabase = await createClient(await cookies());
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (!error) {
      redirectUrl.pathname = "/set-password";
      return NextResponse.redirect(redirectUrl);
    }
  }

  redirectUrl.pathname = "/login";
  redirectUrl.searchParams.set(
    "error",
    "Tautan undangan tidak valid atau sudah kedaluwarsa.",
  );
  return NextResponse.redirect(redirectUrl);
}
