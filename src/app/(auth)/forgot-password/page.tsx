import type { Metadata } from "next";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { requestPasswordReset } from "./actions";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Lupa Kata Sandi | UanginKuy",
  description: "Minta tautan pemulihan kata sandi akun UanginKuy.",
};

export default async function ForgotPasswordPage() {
  const supabase = await createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return <ForgotPasswordForm resetAction={requestPasswordReset} />;
}
