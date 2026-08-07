import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface HeroProps {
  href?: string;
  label?: string;
  revealText?: string;
  className?: string;
}

export default function Hero({
  href = "/register",
  label = "Daftar Sekarang",
  revealText = "Mulai dari rumah",
  className,
}: HeroProps) {
  return (
    <Link
      href={href}
      aria-label={`${label} — ${revealText}`}
      className={cn(
        "group relative inline-flex min-h-12 w-full cursor-pointer items-center justify-between overflow-hidden rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground shadow-[0_10px_30px_rgba(48,109,41,0.24)] outline-none transition-[background-color,box-shadow] duration-200 hover:bg-primary-dark hover:shadow-[0_14px_36px_rgba(13,83,14,0.28)] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-[18.5rem]",
        className,
      )}
    >
      <span className="relative z-10 whitespace-nowrap">{label}</span>
      <span className="relative z-10 ml-4 flex h-8 items-center justify-end overflow-hidden rounded-lg bg-white/15 px-2 transition-[width,background-color] duration-200 ease-out motion-reduce:transition-none sm:w-8 sm:group-hover:w-[7.75rem] sm:group-focus-visible:w-[7.75rem]">
        <span className="mr-2 hidden whitespace-nowrap text-xs font-semibold opacity-0 transition-opacity delay-75 duration-150 motion-reduce:transition-none sm:block sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100">
          {revealText}
        </span>
        <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
      </span>
    </Link>
  );
}
