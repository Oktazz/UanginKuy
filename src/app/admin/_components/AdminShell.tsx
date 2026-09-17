"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { cn } from "@/lib/utils";

interface AdminShellProps {
  isSuperAdmin: boolean;
  children: React.ReactNode;
}

function getStoredSidebarState(): boolean | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = window.localStorage.getItem("admin_sidebar_collapsed");
      if (saved !== null) return saved === "true";
    }
  } catch {
    // Ignore storage errors (e.g. private browsing or disabled storage)
  }
  return null;
}

function setStoredSidebarState(value: boolean) {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem("admin_sidebar_collapsed", String(value));
    }
  } catch {
    // Ignore storage errors
  }
}

function getInitialCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  if (window.innerWidth < 1024) return true;
  const saved = getStoredSidebarState();
  if (saved !== null) return saved;
  return false;
}

function getInitialMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
}

export function AdminShell({ isSuperAdmin, children }: AdminShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(getInitialCollapsed);
  const [isMobile, setIsMobile] = useState(getInitialMobile);

  useEffect(() => {
    const handleViewportChange = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      setIsMobile(mobile);

      // Auto-collapse when screen size is smaller (< 1024px)
      if (width < 1024) {
        setIsCollapsed(true);
      } else {
        const saved = getStoredSidebarState();
        if (saved !== null) {
          setIsCollapsed(saved);
        } else {
          setIsCollapsed(false);
        }
      }
    };

    const mediaQuery =
      typeof window !== "undefined" && window.matchMedia
        ? window.matchMedia("(max-width: 1023px)")
        : null;

    if (mediaQuery?.addEventListener) {
      mediaQuery.addEventListener("change", handleViewportChange);
    }
    window.addEventListener("resize", handleViewportChange);

    return () => {
      if (mediaQuery?.removeEventListener) {
        mediaQuery.removeEventListener("change", handleViewportChange);
      }
      window.removeEventListener("resize", handleViewportChange);
    };
  }, []);

  const handleToggle = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined" && window.innerWidth >= 1024) {
        setStoredSidebarState(next);
      }
      return next;
    });
  };

  const handleClose = () => {
    setIsCollapsed(true);
  };

  return (
    <div className="min-h-screen bg-background flex font-sans text-gray-900 relative">
      {/* Mobile backdrop overlay when sidebar is expanded on small screens */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 bg-black/40 z-30 transition-opacity duration-300 md:hidden"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      <AdminSidebar
        isSuperAdmin={isSuperAdmin}
        isCollapsed={isCollapsed}
        onToggle={handleToggle}
        onItemClick={() => {
          if (isMobile) handleClose();
        }}
      />

      <main
        className={cn(
          "flex-1 h-screen overflow-y-auto transition-all duration-300 ease-in-out",
          isCollapsed ? "ml-16 sm:ml-20" : isMobile ? "ml-16 sm:ml-20" : "ml-72"
        )}
      >
        <div className="p-4 sm:p-6 lg:p-10 max-w-[1600px] mx-auto min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
