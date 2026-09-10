"use client";

import type React from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function GoogleLogo({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

export interface GoogleSignInButtonProps {
  label?: string;
  loadingLabel?: string;
  className?: string;
}

export function GoogleSignInButton({
  label = "Masuk dengan Google",
  loadingLabel = "Menghubungkan ke Google...",
  className,
}: GoogleSignInButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
      className={cn(
        "flex min-h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-input bg-white px-4 py-3 text-sm font-bold text-foreground shadow-xs transition-all duration-200 hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-65",
        className,
      )}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin text-primary" aria-hidden="true" />
          <span>{loadingLabel}</span>
        </>
      ) : (
        <>
          <GoogleLogo className="size-5 shrink-0" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
