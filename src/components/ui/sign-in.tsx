"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";

import { AuthTransitionLink, AuthTransitionSurface } from "./auth-transition";
import { AuthVisualPanel } from "./auth-visual-panel";
import { ErrorAlert } from "./ErrorAlert";

export interface SignInPageProps {
  signInAction: (formData: FormData) => void | Promise<void>;
  error?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  resetPasswordHref?: string;
  createAccountHref?: "/register";
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-[0_12px_30px_rgba(48,109,41,0.22)] transition-[background-color,box-shadow] duration-200 hover:bg-primary-dark hover:shadow-[0_14px_34px_rgba(13,83,14,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-65"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Memproses...
        </>
      ) : (
        <>
          Masuk ke akun
          <ArrowRight className="size-4" aria-hidden="true" />
        </>
      )}
    </button>
  );
}

export function SignInPage({
  signInAction,
  error,
  title = "Selamat datang kembali",
  description = "Masuk untuk melanjutkan perjalanan daur ulangmu bersama UanginKuy.",
  resetPasswordHref = "/forgot-password",
  createAccountHref = "/register",
}: SignInPageProps) {
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    sessionStorage.removeItem("onboarding_shown");
  }, []);

  return (
    <AuthTransitionSurface className="relative min-h-svh overflow-x-hidden bg-background lg:grid lg:grid-cols-[minmax(0,0.92fr)_minmax(30rem,1.08fr)]">
      <section className="relative flex min-h-svh items-center justify-center px-4 py-6 sm:px-8 sm:py-10 lg:px-10 xl:px-16">
        <div className="pointer-events-none absolute -left-20 -top-24 size-60 rounded-full bg-secondary/55 blur-3xl lg:hidden" />
        <div className="pointer-events-none absolute -bottom-24 -right-20 size-64 rounded-full bg-primary/10 blur-3xl lg:hidden" />

        <div className="relative z-10 w-full max-w-[29rem] rounded-[2rem] border border-white/80 bg-surface/90 p-5 shadow-[0_24px_70px_rgba(31,41,55,0.10)] backdrop-blur-xl sm:p-8 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
          <div className="flex items-center gap-2.5 lg:hidden">
            <Image
              src="/logo.png"
              alt="UanginKuy Logo"
              width={36}
              height={36}
              className="size-9 object-contain"
              priority
            />
            <span className="text-base font-extrabold tracking-tight text-primary-dark">
              UanginKuy
            </span>
          </div>

          <div className="mt-8 lg:mt-0">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Masuk ke akun
            </p>
            <h1 className="text-3xl font-bold leading-tight tracking-[-0.035em] text-foreground sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 max-w-sm text-sm font-medium leading-6 text-muted-foreground sm:text-base">
              {description}
            </p>
          </div>

          <ErrorAlert message={error} id="login-error" className="mt-6" />

          <form action={signInAction} className="mt-7 space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-bold text-foreground">
                Alamat email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                aria-invalid={error ? "true" : undefined}
                aria-describedby={error ? "login-error" : undefined}
                placeholder="nama@email.com"
                className="min-h-12 w-full rounded-xl border border-input bg-white px-4 text-base text-foreground shadow-sm outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-muted-foreground/70 hover:border-primary/40 focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-4">
                <label htmlFor="password" className="text-sm font-bold text-foreground">
                  Kata sandi
                </label>
                <Link
                  href={resetPasswordHref}
                  className="cursor-pointer rounded-sm text-sm font-bold text-primary underline-offset-4 transition-colors duration-200 hover:text-primary-dark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Lupa kata sandi?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  minLength={6}
                  aria-invalid={error ? "true" : undefined}
                  aria-describedby={error ? "login-error" : undefined}
                  placeholder="Masukkan kata sandi"
                  className="min-h-12 w-full rounded-xl border border-input bg-white px-4 pr-14 text-base text-foreground shadow-sm outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-muted-foreground/70 hover:border-primary/40 focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-1 flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {showPassword ? (
                    <EyeOff className="size-5" aria-hidden="true" />
                  ) : (
                    <Eye className="size-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <SubmitButton />
          </form>

          <p className="mt-6 text-center text-sm font-medium text-muted-foreground">
            Belum punya akun?{" "}
            <AuthTransitionLink
              href={createAccountHref}
              direction="forward"
              className="rounded-sm font-bold text-primary underline-offset-4 transition-colors duration-200 hover:text-primary-dark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Buat akun
            </AuthTransitionLink>
          </p>
        </div>
      </section>

      <AuthVisualPanel variant="login" />
    </AuthTransitionSurface>
  );
}
