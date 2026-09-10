import type { Metadata } from "next";

import { SignUpPage } from "@/components/ui/sign-up";
import { signup, signInWithGoogle } from "../login/actions";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Daftar | UanginKuy",
  description:
    "Buat akun nasabah UanginKuy untuk menjadwalkan penjemputan dan mengelola nilai sampahmu.",
};

export default async function RegisterPage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const searchParams = await props.searchParams;

  return (
    <SignUpPage
      signUpAction={signup}
      googleSignUpAction={signInWithGoogle}
      error={searchParams.error}
    />
  );
}
