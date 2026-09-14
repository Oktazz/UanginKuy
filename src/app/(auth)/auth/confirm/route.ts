import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { syncGoogleAvatarToStorage } from "@/services/avatar-sync.service";

export async function GET(request: NextRequest) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.search = "";

  // Support reverse proxy / Vercel forwarded host if applicable in production
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (
    process.env.NODE_ENV === "production" &&
    forwardedHost &&
    !forwardedHost.includes("localhost")
  ) {
    redirectUrl.host = forwardedHost;
    redirectUrl.protocol = "https:";
  }

  try {
    const tokenHash = request.nextUrl.searchParams.get("token_hash");
    const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
    const code = request.nextUrl.searchParams.get("code");
    const requestedNext = request.nextUrl.searchParams.get("next");

    const oauthError = request.nextUrl.searchParams.get("error");
    const oauthErrorDescription =
      request.nextUrl.searchParams.get("error_description");

    if (oauthError || oauthErrorDescription) {
      console.error(
        "[auth/confirm] OAuth error from provider:",
        oauthError,
        oauthErrorDescription,
      );
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set(
        "error",
        oauthErrorDescription || oauthError || "Gagal masuk dengan Google.",
      );
      return NextResponse.redirect(redirectUrl);
    }

    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);

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
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            const googleAvatar =
              user.user_metadata?.avatar_url || user.user_metadata?.picture;
            if (googleAvatar) {
              const { data: profile } = await supabase
                .from("profiles")
                .select("avatar_url")
                .eq("id", user.id)
                .maybeSingle();

              if (!profile?.avatar_url) {
                await syncGoogleAvatarToStorage(user.id, googleAvatar).catch(
                  (syncErr) => {
                    console.warn("[auth/confirm] Avatar sync failed:", syncErr);
                  },
                );
              }
            }
          }
        } catch (syncErr) {
          console.warn("[auth/confirm] Avatar sync error:", syncErr);
        }

        redirectUrl.pathname =
          requestedNext === "/set-password" ? requestedNext : "/dashboard";
        return NextResponse.redirect(redirectUrl);
      }
      console.error("[auth/confirm] exchangeCodeForSession error:", error);
    }

    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set(
      "error",
      "Tautan autentikasi tidak valid atau sudah kedaluwarsa.",
    );
    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("[auth/confirm] Unexpected server error:", err);
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set(
      "error",
      "Terjadi kesalahan pada server saat memproses autentikasi. Silakan coba lagi.",
    );
    return NextResponse.redirect(redirectUrl);
  }
}
