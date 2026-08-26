import Image from "next/image";
import { KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { setInvitedUserPassword } from "./actions";

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <section className="w-full max-w-md rounded-3xl border border-gray-100 bg-surface p-8 shadow-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Image
            src="/logo.png"
            alt="UanginKuy Logo"
            width={36}
            height={36}
            className="size-9 object-contain"
            priority
          />
          <span className="text-xl font-extrabold tracking-tight text-primary">
            UanginKuy
          </span>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <KeyRound size={28} aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-gray-900">
            Buat Password
          </h1>
          <p className="mt-2 text-sm font-medium text-gray-500">
            Selesaikan aktivasi akun staf UanginKuy Anda.
          </p>
        </div>

        {error && (
          <div role="alert" className="mt-6 rounded-2xl bg-error/10 px-4 py-3 text-sm font-semibold text-error">
            {error}
          </div>
        )}

        <form action={setInvitedUserPassword} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-bold text-gray-700"
            >
              Password baru
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <div>
            <label
              htmlFor="confirmation"
              className="mb-1.5 block text-sm font-bold text-gray-700"
            >
              Ulangi password
            </label>
            <Input
              id="confirmation"
              name="confirmation"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <div className="flex items-start gap-2 rounded-2xl bg-gray-50 px-4 py-3 text-xs font-medium text-gray-600">
            <ShieldCheck
              size={17}
              className="mt-0.5 shrink-0 text-primary"
              aria-hidden="true"
            />
            Gunakan minimal 8 karakter dan jangan memakai password yang sama
            dengan layanan lain.
          </div>

          <Button type="submit" className="w-full">
            Simpan Password & Lanjutkan
          </Button>
        </form>
      </section>
    </main>
  );
}
