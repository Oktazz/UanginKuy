"use client";

import type React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

export type AuthTransitionDirection = "forward" | "backward";

interface AuthTransitionSurfaceProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthTransitionSurface({
  children,
  className,
}: AuthTransitionSurfaceProps) {
  const surfaceRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (!document.documentElement.dataset.authEnter) return;

    surfaceRef.current
      ?.querySelector("[data-auth-aside]")
      ?.setAttribute("data-auth-aside-skip", "");

    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        document.documentElement.removeAttribute("data-auth-enter");
      });
    });

    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, []);

  return (
    <main
      ref={surfaceRef}
      data-auth-page
      data-testid="auth-transition-surface"
      className={className}
    >
      {children}
    </main>
  );
}

interface AuthTransitionLinkProps
  extends Omit<React.ComponentProps<typeof Link>, "href"> {
  href: "/login" | "/register";
  direction: AuthTransitionDirection;
}

const EXIT_DURATION_MS = 160;

export function AuthTransitionLink({
  href,
  direction,
  className,
  onClick,
  children,
  ...props
}: AuthTransitionLinkProps) {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    router.prefetch(href);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [href, router]);

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;

    const isModifiedClick =
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0;
    const prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isKeyboardActivation = event.detail === 0;

    if (isNavigating) {
      event.preventDefault();
      return;
    }

    if (
      isModifiedClick ||
      isKeyboardActivation ||
      prefersReducedMotion
    ) {
      return;
    }

    event.preventDefault();
    setIsNavigating(true);

    const page = event.currentTarget.closest<HTMLElement>("[data-auth-page]");
    page?.setAttribute("data-auth-leaving", direction);

    timerRef.current = setTimeout(() => {
      document.documentElement.dataset.authEnter = direction;
      router.push(href);
    }, EXIT_DURATION_MS);
  };

  return (
    <Link
      href={href}
      aria-busy={isNavigating || undefined}
      className={cn("cursor-pointer", className)}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  );
}
