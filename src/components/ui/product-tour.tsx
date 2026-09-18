"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createPortal } from "react-dom";

export type TourPlacement = "top" | "bottom" | "left" | "right" | "auto" | "center";

export type TourStep = {
  target?: string;
  title: string;
  content: React.ReactNode;
  placement?: TourPlacement;
  padding?: number;
  radius?: number;
};

export type TourProps = {
  steps: TourStep[];
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  index?: number;
  onIndexChange?: (index: number) => void;
  onFinish?: () => void;
  onSkip?: () => void;
  showProgress?: boolean;
  clickToNext?: boolean;
  dark?: boolean;
  className?: string;
  nextLabel?: string;
  prevLabel?: string;
  doneLabel?: string;
  overlayColor?: string;
};

type Rect = { top: number; left: number; width: number; height: number };

const SPRING = { type: "spring" as const, stiffness: 320, damping: 32, mass: 0.7 };

function findVisibleElement(selector: string): HTMLElement | null {
  if (typeof document === "undefined") return null;
  try {
    const elements = Array.from(document.querySelectorAll(selector)) as HTMLElement[];
    if (elements.length === 0) return null;
    const visible = elements.find((el) => {
      const r = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return (
        r.width > 0 &&
        r.height > 0 &&
        style.display !== "none" &&
        style.visibility !== "hidden"
      );
    });
    return visible || elements[0] || null;
  } catch {
    return null;
  }
}

export function Tour({
  steps,
  open,
  onOpenChange,
  index: controlledIndex,
  onIndexChange,
  onFinish,
  onSkip,
  showProgress = true,
  clickToNext = false,
  dark,
  className,
  nextLabel = "Lanjut",
  prevLabel = "Kembali",
  doneLabel = "Selesai",
  overlayColor,
}: TourProps) {
  const baseId = React.useId().replace(/:/g, "_");
  const maskId = `${baseId}-tour-mask`;
  const glowId = `${baseId}-tour-glow`;
  const reduce = useReducedMotion();
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [indexState, setIndexState] = React.useState(0);
  const index = controlledIndex ?? indexState;
  const setIndex = React.useCallback(
    (i: number) => {
      onIndexChange?.(i);
      setIndexState(i);
    },
    [onIndexChange],
  );

  const rootRef = React.useRef<HTMLDivElement>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [rect, setRect] = React.useState<Rect | null>(null);
  const [cardSize, setCardSize] = React.useState({ w: 320, h: 168 });
  const [vp, setVp] = React.useState({ w: 1024, h: 768 });
  const domDark = React.useSyncExternalStore(
    (onStoreChange) => {
      if (typeof MutationObserver === "undefined") return () => {};
      const observer = new MutationObserver(onStoreChange);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ["class"],
      });
      return () => observer.disconnect();
    },
    () =>
      typeof document !== "undefined"
        ? document.documentElement.classList.contains("dark") ||
          document.body.classList.contains("dark")
        : false,
    () => false,
  );

  const step = steps[index];
  const count = steps.length;
  const isFirst = index === 0;
  const isLast = index === count - 1;
  const pad = step?.padding ?? 8;

  const finish = React.useCallback(() => {
    onFinish?.();
    onOpenChange?.(false);
    setIndexState(0);
  }, [onFinish, onOpenChange]);

  const skip = React.useCallback(() => {
    onSkip?.();
    onOpenChange?.(false);
    setIndexState(0);
  }, [onSkip, onOpenChange]);

  const next = React.useCallback(() => {
    if (isLast) finish();
    else setIndex(index + 1);
  }, [isLast, finish, index, setIndex]);

  const back = React.useCallback(() => {
    if (!isFirst) setIndex(index - 1);
  }, [isFirst, index, setIndex]);

  React.useEffect(() => {
    if (!open) return;
    const measure = () => {
      setVp({ w: window.innerWidth, h: window.innerHeight });
      if (!step?.target) {
        setRect(null);
        return;
      }
      const el = findVisibleElement(step.target);
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    const el = step?.target ? findVisibleElement(step.target) : null;
    if (typeof el?.scrollIntoView === "function") {
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center", inline: "center" });
    }

    measure();
    const settle = window.setTimeout(measure, reduce ? 0 : 320);
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(settle);
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [open, index, step, reduce]);

  React.useLayoutEffect(() => {
    if (cardRef.current) {
      const r = cardRef.current.getBoundingClientRect();
      setCardSize({ w: r.width, h: r.height });
    }
  }, [index, open, rect]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        skip();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        back();
      } else if (e.key === "Tab") {
        const focusables = cardRef.current?.querySelectorAll<HTMLElement>(
          "button, [href], input, [tabindex]:not([tabindex='-1'])",
        );
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, next, back, skip]);

  React.useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      cardRef.current?.querySelector<HTMLElement>("[data-tour-primary]")?.focus();
    }, 40);
    return () => window.clearTimeout(t);
  }, [open, index]);

  if (!mounted || !open || !step) return null;

  const isDark = dark ?? domDark;

  const spot = rect
    ? {
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null;

  const gap = 14;
  let place: TourPlacement = step.placement ?? "auto";
  if (!rect) {
    place = "center";
  } else {
    // Check if preferred placement fits without collision
    const fitsBottom = rect.top + rect.height + gap + pad + cardSize.h <= vp.h - 12;
    const fitsTop = rect.top - gap - pad - cardSize.h >= 12;
    const fitsRight = rect.left + rect.width + gap + pad + cardSize.w <= vp.w - 12;
    const fitsLeft = rect.left - gap - pad - cardSize.w >= 12;

    if (place === "left" && !fitsLeft) {
      place = fitsTop ? "top" : fitsBottom ? "bottom" : "auto";
    } else if (place === "right" && !fitsRight) {
      place = fitsTop ? "top" : fitsBottom ? "bottom" : "auto";
    } else if (place === "bottom" && !fitsBottom) {
      place = fitsTop ? "top" : "auto";
    } else if (place === "top" && !fitsTop) {
      place = fitsBottom ? "bottom" : "auto";
    }

    if (place === "auto") {
      if (fitsBottom) place = "bottom";
      else if (fitsTop) place = "top";
      else if (fitsRight) place = "right";
      else if (fitsLeft) place = "left";
      else place = "top";
    }
  }

  let left = vp.w / 2 - cardSize.w / 2;
  let top = vp.h / 2 - cardSize.h / 2;
  if (rect) {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    if (place === "bottom") {
      left = cx - cardSize.w / 2;
      top = rect.top + rect.height + gap + pad;
    } else if (place === "top") {
      left = cx - cardSize.w / 2;
      top = rect.top - gap - pad - cardSize.h;
    } else if (place === "right") {
      left = rect.left + rect.width + gap + pad;
      top = cy - cardSize.h / 2;
    } else if (place === "left") {
      left = rect.left - gap - pad - cardSize.w;
      top = cy - cardSize.h / 2;
    }
  }
  left = Math.min(Math.max(12, left), vp.w - 12 - cardSize.w);
  top = Math.min(Math.max(12, top), vp.h - 12 - cardSize.h);

  // Safety collision check: ensure the tour card never covers the spotlighted target
  if (spot) {
    const cardBottom = top + cardSize.h;
    const cardRight = left + cardSize.w;
    const isColliding =
      left < spot.left + spot.width &&
      cardRight > spot.left &&
      top < spot.top + spot.height &&
      cardBottom > spot.top;

    if (isColliding) {
      const topClearance = spot.top;
      const bottomClearance = vp.h - (spot.top + spot.height);
      if (topClearance >= bottomClearance) {
        top = Math.max(12, spot.top - gap - cardSize.h);
      } else {
        top = Math.min(vp.h - 12 - cardSize.h, spot.top + spot.height + gap);
      }
    }
  }

  const overlayInk =
    overlayColor ?? (isDark ? "rgba(0, 0, 0, 0.85)" : "rgba(0, 0, 0, 0.75)");

  const spotRadius = step.radius ?? 16;

  return createPortal(
    <div ref={rootRef} className={`${isDark ? "dark" : ""} ${className ?? ""}`}>
      <AnimatePresence>
        <motion.div
          key="tour-layer"
          className="fixed inset-0 z-[100]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.2 }}
          aria-hidden={false}
          role="dialog"
          aria-modal="true"
          aria-label={typeof step.title === "string" ? step.title : "Product tour"}
        >
          <div className="absolute inset-0" onClick={() => clickToNext && next()} />

          {/* SVG Mask Overlay: guarantees dark backdrop and 100% transparent cutout on all GPUs/browsers */}
          <svg
            className="pointer-events-none fixed inset-0 z-0 h-full w-full"
            style={{ width: "100vw", height: "100vh" }}
            aria-hidden="true"
          >
            <defs>
              <mask id={maskId}>
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {spot && (
                  <motion.rect
                    initial={false}
                    animate={{
                      x: spot.left,
                      y: spot.top,
                      width: spot.width,
                      height: spot.height,
                      rx: spotRadius,
                    }}
                    transition={reduce ? { duration: 0 } : SPRING}
                    fill="black"
                  />
                )}
              </mask>
              <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="rgba(48, 109, 41, 0.85)" />
                <feDropShadow dx="0" dy="0" stdDeviation="12" floodColor="rgba(255, 255, 255, 0.6)" />
              </filter>
            </defs>

            {/* Darkened backdrop punched out by mask */}
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill={overlayInk}
              mask={`url(#${maskId})`}
            />          
          </svg>

          <motion.div
            ref={cardRef}
            className="absolute w-[330px] max-w-[calc(100vw-24px)] rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xl shadow-black/20 dark:border-zinc-800 dark:bg-zinc-900"
            initial={reduce ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1, left, top }}
            transition={reduce ? { duration: 0 } : SPRING}
            style={{ left, top }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-[14px] font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
                {step.title}
              </h3>
              <button
                type="button"
                onClick={skip}
                aria-label="Tutup tur"
                className="-mr-1 -mt-1 rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              >
                <IconX />
              </button>
            </div>

            <div className="mt-1.5 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
              {step.content}
            </div>

            <div className="mt-4 flex items-center justify-between">
              {showProgress ? (
                <div className="flex items-center gap-1.5" aria-hidden>
                  {steps.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === index
                          ? "w-4 bg-primary dark:bg-emerald-400"
                          : "w-1.5 bg-zinc-200 dark:bg-zinc-700"
                      }`}
                    />
                  ))}
                </div>
              ) : (
                <span className="text-[11px] tabular-nums text-zinc-400">
                  {index + 1} / {count}
                </span>
              )}

              <div className="flex items-center gap-1.5">
                {!isFirst && (
                  <button
                    type="button"
                    onClick={back}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  >
                    <IconArrow className="rotate-180" />
                    {prevLabel}
                  </button>
                )}
                <button
                  type="button"
                  data-tour-primary
                  onClick={next}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:bg-primary dark:text-primary-foreground"
                >
                  {isLast ? doneLabel : nextLabel}
                  {!isLast && <IconArrow />}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body,
  );
}

export function useTour(storageKey?: string) {
  const [open, setOpen] = React.useState(false);
  const [index, setIndex] = React.useState(0);

  const seen = React.useCallback(() => {
    if (!storageKey) return false;
    try {
      return localStorage.getItem(storageKey) === "1";
    } catch {
      return false;
    }
  }, [storageKey]);

  const start = React.useCallback(() => {
    setIndex(0);
    setOpen(true);
  }, []);

  const markSeen = React.useCallback(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      return;
    }
  }, [storageKey]);

  return { open, setOpen, index, setIndex, start, seen, markSeen };
}

function IconX() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" className="h-4 w-4">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function IconArrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className={`h-3.5 w-3.5 ${className}`}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
