"use client";

import { useSyncExternalStore, useCallback } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { cn } from "@/lib/utils";

interface AdminShellProps {
  isSuperAdmin: boolean;
  children: React.ReactNode;
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

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

// ─── External store: viewport layout ─────────────────────────────────────────
//
// useSyncExternalStore is the React-approved pattern for reading external state
// (window.innerWidth, localStorage) without causing hydration mismatches.
// The `getServerSnapshot` always returns false — identical to the initial client
// render — so server HTML and first client render are always the same.

interface LayoutSnapshot {
  isCollapsed: boolean;
  isMobile: boolean;
}

const COLLAPSED_SERVER: LayoutSnapshot = { isCollapsed: false, isMobile: false };

function getLayoutSnapshot(): LayoutSnapshot {
  const w = window.innerWidth;
  const mobile = w < 768;

  let collapsed: boolean;
  if (w < 1024) {
    collapsed = true;
  } else {
    const saved = getStoredSidebarState();
    collapsed = saved !== null ? saved : false;
  }

  return { isCollapsed: collapsed, isMobile: mobile };
}

let _layoutSnapshot = COLLAPSED_SERVER;
const _layoutListeners = new Set<() => void>();

function subscribeLayout(onStoreChange: () => void) {
  _layoutListeners.add(onStoreChange);

  const notify = () => {
    _layoutSnapshot = getLayoutSnapshot();
    _layoutListeners.forEach((fn) => fn());
  };

  const mq =
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(max-width: 1023px)")
      : null;

  if (mq?.addEventListener) mq.addEventListener("change", notify);
  window.addEventListener("resize", notify);

  return () => {
    _layoutListeners.delete(onStoreChange);
    if (mq?.removeEventListener) mq.removeEventListener("change", notify);
    window.removeEventListener("resize", notify);
  };
}

function getLayoutClientSnapshot(): LayoutSnapshot {
  // Re-compute only once on first client read; subsequent reads use cached value
  if (_layoutSnapshot === COLLAPSED_SERVER) {
    _layoutSnapshot = getLayoutSnapshot();
  }
  return _layoutSnapshot;
}

function getLayoutServerSnapshot(): LayoutSnapshot {
  return COLLAPSED_SERVER;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminShell({ isSuperAdmin, children }: AdminShellProps) {
  const layout = useSyncExternalStore(
    subscribeLayout,
    getLayoutClientSnapshot,
    getLayoutServerSnapshot,
  );

  // Derive from snapshot — isCollapsed may be overridden by manual toggle
  // We track manual toggle via a separate useSyncExternalStore-compatible store.
  const isCollapsed = layout.isCollapsed;
  const isMobile = layout.isMobile;

  const handleToggle = useCallback(() => {
    const next = !_layoutSnapshot.isCollapsed;
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      setStoredSidebarState(next);
    }
    // Update snapshot and notify subscribers so useSyncExternalStore re-renders
    _layoutSnapshot = { ..._layoutSnapshot, isCollapsed: next };
    _layoutListeners.forEach((fn) => fn());
  }, []);

  const handleClose = useCallback(() => {
    _layoutSnapshot = { ..._layoutSnapshot, isCollapsed: true };
    _layoutListeners.forEach((fn) => fn());
  }, []);

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
