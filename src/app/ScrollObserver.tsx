"use client";

import { useEffect } from "react";

export default function ScrollObserver() {
  useEffect(() => {
    // Simple scroll spy for active nav state
    const sections = document.querySelectorAll("section[id]");
    const navLinks = document.querySelectorAll(".hidden.md\\:flex a[href^=\"#\"]");
    
    const handleScroll = () => {
      let current = "";
      sections.forEach((section) => {
        const sectionTop = (section as HTMLElement).offsetTop;
        if (window.scrollY >= sectionTop - 100) {
          current = section.getAttribute("id") || "";
        }
      });

      navLinks.forEach((link) => {
        link.classList.remove("text-primary", "font-bold", "border-b-2", "border-primary", "pb-1");
        link.classList.add("text-muted-foreground", "font-medium");
        if (link.getAttribute("href")?.substring(1) === current) {
          link.classList.remove("text-muted-foreground", "font-medium");
          link.classList.add("text-primary", "font-bold", "border-b-2", "border-primary", "pb-1");
        }
      });
      
      // Navbar effect on scroll
      const navbar = document.getElementById("navbar");
      if (navbar) {
        if (window.scrollY > 10) {
          navbar.classList.add("shadow-md");
          navbar.classList.add("border-border");
          navbar.classList.remove("border-transparent");
        } else {
          navbar.classList.remove("shadow-md");
          navbar.classList.remove("border-border");
          navbar.classList.add("border-transparent");
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Call once on mount

    // Intersection Observer for scroll animations
    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-element");
          entry.target.classList.remove("opacity-0");
          // Optional: unobserve after animating once
          // observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    document.querySelectorAll(".reveal-up").forEach((el) => {
      // Ensure element is hidden initially before animation
      el.classList.add("opacity-0");
      observer.observe(el);
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  return null;
}
