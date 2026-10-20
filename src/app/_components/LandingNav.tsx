"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ArrowRight } from "lucide-react";

export function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  // Handle scroll to shrink navbar after scrolling past the hero section
  useEffect(() => {
    const handleScroll = () => {
      // Trigger specifically when scrolled past the hero section
      const heroEl = document.getElementById("hero");
      if (heroEl) {
        const heroBottom = heroEl.getBoundingClientRect().bottom;
        setIsScrolled(heroBottom <= 90);
      } else {
        setIsScrolled(window.scrollY > 500);
      }

      // Section scroll spy
      const sectionIds = ["inovasi", "cara-kerja", "ulasan", "cabang", "faq"];
      let current = "";
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 140 && rect.bottom >= 140) {
            current = id;
            break;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    { label: "Inovasi", href: "#inovasi" },
    { label: "Cara Kerja", href: "#cara-kerja" },
    { label: "Ulasan", href: "#ulasan" },
    { label: "Cabang Bali", href: "#cabang" },
    { label: "FAQ & Tanya AI", href: "#faq" },
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
      <header
        role="banner"
        className="fixed top-3 md:top-4 inset-x-0 mx-auto z-50 px-4 transition-all duration-300 pointer-events-none"
      >
        <div
          className={`pointer-events-auto mx-auto transition-all duration-300 ease-out rounded-full border ${
            isScrolled
              ? "max-w-5xl py-2 px-4.5 md:px-5.5 bg-[#e7dfcb]/95 backdrop-blur-2xl shadow-md border-[#d5ccb4] scale-[0.97]"
              : "max-w-6xl py-3.5 px-6 md:px-7 bg-[#ede6d4]/90 backdrop-blur-xl shadow-xs border-[#dcd3bd] scale-100"
          }`}
          id="navbar"
        >
          <div className="flex justify-between items-center">
            {/* Brand Logo & Name */}
            <Link
              className="flex items-center gap-2.5 group cursor-pointer"
              href="/"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="relative flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="UanginKuy Logo"
                  width={32}
                  height={32}
                  className={`object-contain transition-all duration-300 group-hover:scale-105 ${
                    isScrolled ? "w-7 h-7" : "w-8 h-8"
                  }`}
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span
                  className={`font-semibold text-primary transition-all duration-300 tracking-tight leading-none ${
                    isScrolled ? "text-sm md:text-base" : "text-base md:text-lg"
                  }`}
                >
                  UanginKuy
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              {navLinks.map((link) => {
                const isActive = activeSection === link.href.substring(1);
                return (
                  <a
                    key={link.href}
                    className={`rounded-full transition-all duration-200 cursor-pointer ${
                      isScrolled ? "px-3 py-1 text-xs" : "px-3.5 py-1.5 text-sm"
                    } ${
                      isActive
                        ? "bg-primary text-white font-semibold shadow-2xs"
                        : "text-foreground/80 hover:text-foreground hover:bg-black/[0.05] font-medium"
                    }`}
                    href={link.href}
                    onClick={(e) => handleScrollTo(e, link.href)}
                  >
                    {link.label}
                  </a>
                );
              })}
            </nav>

            {/* Desktop Right Action Buttons */}
            <div className="hidden md:flex items-center gap-2">
              <Link
                className={`text-foreground font-medium hover:text-primary rounded-full hover:bg-black/[0.05] transition-colors duration-200 cursor-pointer ${
                  isScrolled ? "text-xs px-3 py-1" : "text-sm px-3.5 py-1.5"
                }`}
                href="/login"
              >
                Masuk
              </Link>
              <Link
                className={`inline-flex items-center gap-1.5 bg-primary text-primary-foreground font-medium rounded-full shadow-xs hover:shadow-md hover:bg-primary-dark active:scale-95 transition-all duration-200 cursor-pointer ${
                  isScrolled ? "text-xs px-4 py-1.5" : "text-sm px-5 py-2"
                }`}
                href="/register"
              >
                <span>Daftar Sekarang</span>
                <ArrowRight className={isScrolled ? "w-3 h-3" : "w-3.5 h-3.5"} />
              </Link>
            </div>

            {/* Mobile Hamburger / Close Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
              className="lg:hidden relative flex items-center justify-center w-9 h-9 rounded-full bg-black/[0.06] hover:bg-black/[0.1] active:scale-95 text-foreground transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div
                className={`transition-all duration-300 transform flex items-center justify-center ${
                  mobileMenuOpen
                    ? "rotate-90 opacity-0 scale-75 absolute"
                    : "rotate-0 opacity-100 scale-100"
                }`}
              >
                <Menu className="w-5 h-5 text-foreground" />
              </div>
              <div
                className={`transition-all duration-300 transform flex items-center justify-center ${
                  mobileMenuOpen
                    ? "rotate-0 opacity-100 scale-100 text-primary"
                    : "-rotate-90 opacity-0 scale-75 absolute"
                }`}
              >
                <X className="w-5 h-5" />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown Floating Card */}
        <div
          className={`lg:hidden pointer-events-auto max-w-md mx-auto mt-2 transition-all duration-300 ease-in-out ${
            mobileMenuOpen
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 -translate-y-3 scale-98 pointer-events-none"
          }`}
        >
          <div className="bg-[#ede6d4]/98 backdrop-blur-2xl border border-[#dcd3bd] rounded-3xl p-5 shadow-2xl space-y-3">
            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleScrollTo(e, link.href)}
                  className="px-4 py-2.5 text-sm font-medium text-foreground hover:text-primary hover:bg-primary/10 rounded-2xl transition-all duration-150 cursor-pointer"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="pt-3 border-t border-[#dcd3bd] flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 px-4 rounded-full text-sm font-medium text-foreground border border-[#dcd3bd] hover:bg-black/[0.04] transition-all cursor-pointer"
              >
                Masuk ke Akun
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-sm font-medium bg-primary text-primary-foreground shadow-sm hover:bg-primary-dark active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Daftar Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Backdrop overlay for mobile menu */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}
    </>
  );
}
