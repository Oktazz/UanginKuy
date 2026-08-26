"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ArrowRight } from "lucide-react";

export function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close menu when pressing Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    if (mobileMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: "Fitur", href: "#fitur" },
    { label: "Cara Kerja", href: "#cara-kerja" },
    { label: "FAQ", href: "#faq" },
  ];

  const handleScrollTo = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        const navOffset = 80;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - navOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });

        window.history.pushState(null, "", href);
      }
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      <nav
        className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md border-b border-transparent transition-all duration-300"
        id="navbar"
      >
        <div className="flex justify-between items-center h-20 px-4 md:px-8 max-w-7xl mx-auto">
          {/* Brand */}
          <Link
            className="flex items-center gap-2.5 group"
            href="/"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Image
              src="/logo.png"
              alt="UanginKuy Logo"
              width={36}
              height={36}
              className="h-9 w-9 object-contain group-hover:scale-110 transition-transform duration-300"
              priority
            />
            <span className="text-xl font-bold text-primary transition-colors duration-300 tracking-tight">
              UanginKuy
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                className="text-muted-foreground font-medium hover:text-primary transition-colors duration-300 text-base cursor-pointer"
                href={link.href}
                onClick={(e) => handleScrollTo(e, link.href)}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              className="text-primary font-medium hover:text-primary-dark transition-colors duration-300 px-4 py-2 rounded-lg hover:bg-muted"
              href="/login"
            >
              Masuk
            </Link>
            <Link
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium shadow-sm hover:shadow-lg hover:-translate-y-1 hover:bg-primary-dark transition-all duration-300 active:scale-95"
              href="/register"
            >
              Daftar
            </Link>
          </div>

          {/* Animated Hamburger / Close Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
            className="md:hidden relative flex items-center justify-center w-11 h-11 rounded-2xl bg-muted/60 hover:bg-muted active:scale-95 text-foreground transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div
              className={`transition-all duration-300 transform flex items-center justify-center ${
                mobileMenuOpen
                  ? "rotate-90 opacity-0 scale-75 absolute"
                  : "rotate-0 opacity-100 scale-100"
              }`}
            >
              <Menu className="w-6 h-6 text-foreground" />
            </div>
            <div
              className={`transition-all duration-300 transform flex items-center justify-center ${
                mobileMenuOpen
                  ? "rotate-0 opacity-100 scale-100 text-primary"
                  : "-rotate-90 opacity-0 scale-75 absolute"
              }`}
            >
              <X className="w-6 h-6" />
            </div>
          </button>
        </div>

        {/* Mobile Menu Dropdown with Smooth Grid Expand & Fade */}
        <div
          className={`md:hidden grid transition-[grid-template-rows,opacity] duration-300 ease-in-out border-b border-border/60 bg-surface/95 backdrop-blur-xl ${
            mobileMenuOpen
              ? "grid-rows-[1fr] opacity-100 shadow-2xl"
              : "grid-rows-[0fr] opacity-0 pointer-events-none"
          }`}
        >
          <div className="overflow-hidden">
            <div className="px-5 py-6 space-y-4 max-w-sm mx-auto">
              <div className="flex flex-col space-y-1">
                {navLinks.map((link, index) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => handleScrollTo(e, link.href)}
                    className={`px-4 py-3 text-base font-semibold text-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all duration-200 cursor-pointer ${
                      mobileMenuOpen
                        ? "translate-y-0 opacity-100"
                        : "-translate-y-2 opacity-0"
                    }`}
                    style={{
                      transitionDelay: mobileMenuOpen
                        ? `${(index + 1) * 60}ms`
                        : "0ms",
                    }}
                  >
                    {link.label}
                  </a>
                ))}
              </div>

              <div
                className={`pt-4 border-t border-border/60 flex flex-col gap-3 transition-all duration-300 ${
                  mobileMenuOpen
                    ? "translate-y-0 opacity-100"
                    : "-translate-y-2 opacity-0"
                }`}
                style={{
                  transitionDelay: mobileMenuOpen ? "240ms" : "0ms",
                }}
              >
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-3 px-4 rounded-xl font-semibold text-primary border border-primary/20 hover:bg-primary/5 active:scale-[0.98] transition-all"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold bg-primary text-primary-foreground shadow-md hover:bg-primary-dark active:scale-[0.98] transition-all"
                >
                  Daftar Sekarang
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Backdrop overlay for mobile menu */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}
    </>
  );
}
