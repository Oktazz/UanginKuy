"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Loader2, MailCheck, Send } from "lucide-react";
import { initialResetPasswordState, type ResetPasswordState } from "./state";

interface ForgotPasswordFormProps {
  resetAction: (
    previousState: ResetPasswordState,
    formData: FormData,
  ) => Promise<ResetPasswordState>;
}

function ResetSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(48,109,41,0.22)] transition-[background-color,box-shadow] duration-200 hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-65"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Mengirim...
        </>
      ) : (
        <>
          <Send className="size-4" aria-hidden="true" />
          Kirim tautan pemulihan
        </>
      )}
    </button>
  );
}

export function ForgotPasswordForm({ resetAction }: ForgotPasswordFormProps) {
  const [state, formAction] = useActionState(
    resetAction,
    initialResetPasswordState,
  );
  const isSuccess = state.status === "success";

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-x-hidden bg-background px-4 py-6 sm:px-8 sm:py-10">
      <div className="pointer-events-none absolute -left-20 -top-24 size-72 rounded-full bg-secondary/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 size-72 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 hidden size-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/10 sm:block" />

      <section className="animate-element relative z-10 w-full max-w-md rounded-[2rem] border border-white/80 bg-surface/90 p-5 shadow-[0_24px_70px_rgba(31,41,55,0.10)] backdrop-blur-xl sm:p-8">
        <div className="flex items-center gap-2.5">
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

        <div className="mt-8">
          <span className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MailCheck className="size-6" aria-hidden="true" />
          </span>
          <h1 className="text-3xl font-bold tracking-[-0.035em] text-foreground">
            Atur ulang kata sandi
          </h1>
          <p className="mt-3 text-sm font-medium leading-6 text-muted-foreground">
            Masukkan email akunmu. Kami akan mengirimkan tautan untuk membuat
            kata sandi baru.
          </p>
        </div>

        {state.status !== "idle" && (
          <div
            id="reset-status"
            role={state.status === "error" ? "alert" : "status"}
            className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-semibold ${
              isSuccess
                ? "border-success/20 bg-success/10 text-primary-dark"
                : "border-error/20 bg-error/10 text-error"
            }`}
          >
            {state.message}
          </div>
        )}

        {!isSuccess && (
          <form action={formAction} className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="reset-email"
                className="mb-2 block text-sm font-bold text-foreground"
              >
                Alamat email
              </label>
              <input
                id="reset-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                aria-invalid={state.status === "error" ? "true" : undefined}
                aria-describedby={
                  state.status !== "idle" ? "reset-status" : undefined
                }
                placeholder="nama@email.com"
                className="min-h-12 w-full rounded-xl border border-input bg-white px-4 text-base text-foreground shadow-sm outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-muted-foreground/70 hover:border-primary/40 focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </div>
            <ResetSubmitButton />
          </form>
        )}

        <Link
          href="/login"
          className="mt-6 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-bold text-primary transition-colors duration-200 hover:bg-primary/5 hover:text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Kembali ke halaman masuk
        </Link>
      </section>
    </main>
  );
}
