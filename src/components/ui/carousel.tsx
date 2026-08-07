"use client";

import * as React from "react";
import { ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, Leaf } from "lucide-react";

import { cn } from "@/lib/utils";

export interface NewsCarouselItem {
  id: string;
  title: string;
  summary: string;
  publishedAt: string;
  imageSrc: string;
  href: string;
  source?: string;
  isNew?: boolean;
}

interface NewsCarouselProps extends React.HTMLAttributes<HTMLElement> {
  items: NewsCarouselItem[];
  title?: string;
  subtitle?: string;
}

export const NewsCarousel = React.forwardRef<HTMLElement, NewsCarouselProps>(
  (
    {
      items,
      title = "Kabar Lingkungan",
      subtitle = "Wawasan terbaru untuk hidup lebih hijau.",
      className,
      ...props
    },
    ref,
  ) => {
    const headingId = React.useId();
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = React.useState(false);
    const [canScrollRight, setCanScrollRight] = React.useState(false);

    const checkScrollability = React.useCallback(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const { scrollLeft, scrollWidth, clientWidth } = container;
      setCanScrollLeft(scrollLeft > 1);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }, []);

    React.useEffect(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      checkScrollability();
      container.addEventListener("scroll", checkScrollability, { passive: true });
      window.addEventListener("resize", checkScrollability);
      const resizeObserver =
        typeof ResizeObserver === "undefined" ? null : new ResizeObserver(checkScrollability);
      resizeObserver?.observe(container);

      return () => {
        container.removeEventListener("scroll", checkScrollability);
        window.removeEventListener("resize", checkScrollability);
        resizeObserver?.disconnect();
      };
    }, [checkScrollability, items]);

    const scroll = (direction: "left" | "right") => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      container.scrollBy({
        left: (direction === "left" ? -1 : 1) * container.clientWidth * 0.8,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    };

    if (!items.length) return null;

    return (
      <section
        ref={ref}
        className={cn("w-full min-w-0", className)}
        aria-labelledby={headingId}
        {...props}
      >
        <div className="mb-4 flex items-end justify-between gap-4 px-1">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Pilihan untukmu
            </p>
            <h2 id={headingId} className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>

          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <CarouselButton
              label="Geser ke kiri"
              direction="left"
              disabled={!canScrollLeft}
              onClick={() => scroll("left")}
            />
            <CarouselButton
              label="Geser ke kanan"
              direction="right"
              disabled={!canScrollRight}
              onClick={() => scroll("right")}
            />
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          data-testid="news-carousel-track"
          className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-1 pb-4"
        >
          {items.map((item) => (
            <article
              key={item.id}
              className="w-[min(82vw,20rem)] shrink-0 snap-start sm:w-80 lg:w-[21rem]"
            >
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${item.title} — buka artikel`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm outline-none transition-[border-color,box-shadow] duration-300 hover:border-primary/30 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-primary/10">
                  <div className="absolute inset-0 flex items-center justify-center text-primary/35">
                    <Leaf className="h-10 w-10" aria-hidden="true" />
                  </div>
                  {/* RSS images come from changing third-party hosts, so a native image keeps the feed flexible. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageSrc}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    onError={(event) => {
                      event.currentTarget.hidden = true;
                    }}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-4 text-white">
                  {item.isNew && (
                      <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                        Terbaru
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <div className="mb-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    <span>{item.publishedAt}</span>
                  </div>
                  <h3 className="line-clamp-2 text-base font-bold leading-snug text-card-foreground transition-colors group-hover:text-primary sm:text-lg">
                    {item.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {item.summary}
                  </p>
                  <div className="mt-5 flex min-h-6 items-center justify-between gap-3 text-xs font-semibold">
                    <span className="truncate text-muted-foreground">{item.source ?? "Artikel pilihan"}</span>
                    <span className="inline-flex shrink-0 items-center gap-1 text-primary">
                      Baca artikel
                      <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </a>
            </article>
          ))}
        </div>
        <p className="px-1 text-xs text-muted-foreground sm:hidden">Geser untuk melihat berita lainnya</p>
      </section>
    );
  },
);

NewsCarousel.displayName = "NewsCarousel";

function CarouselButton({
  direction,
  label,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  direction: "left" | "right";
  label: string;
}) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      aria-label={label}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-card-foreground shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-35"
      {...props}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
