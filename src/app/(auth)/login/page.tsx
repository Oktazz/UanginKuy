import type { Metadata } from "next";
import { SignInPage } from "@/components/ui/sign-in";
import { login, signInWithGoogle } from "./actions";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Masuk | UanginKuy",
  description:
    "Masuk ke akun UanginKuy untuk mengelola aktivitas daur ulangmu.",
};

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const searchParams = await props.searchParams;

  return (
    <SignInPage
      signInAction={login}
      googleSignInAction={signInWithGoogle}
      error={searchParams.error}
    />
  );
}
