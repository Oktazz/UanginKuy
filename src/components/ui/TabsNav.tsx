"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabItem<T extends string = string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsNavProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (tab: T) => void;
  ariaLabel?: string;
  className?: string;
  tabClassName?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
}

export function TabsNav<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  ariaLabel = "Navigasi tab",
  className,
  tabClassName,
  activeClassName = "bg-white shadow-sm text-primary",
  inactiveClassName = "text-gray-500 hover:text-gray-700",
  fullWidth = true,
  size = "md",
}: TabsNavProps<T>) {
  const sizeStyles = {
    sm: "py-1.5 px-3 text-xs rounded-lg",
    md: "py-2.5 px-4 text-sm rounded-lg",
    lg: "py-3 px-4 text-sm rounded-lg",
  };

  return (
    <nav
      aria-label={ariaLabel}
      className={cn("flex rounded-xl bg-gray-100/70 p-1", className)}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            disabled={tab.disabled}
            onClick={() => onChange(tab.value)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center justify-center gap-2 font-bold transition-all cursor-pointer select-none",
              fullWidth && "flex-1 text-center",
              sizeStyles[size],
              isActive ? activeClassName : inactiveClassName,
              tab.disabled && "opacity-50 cursor-not-allowed",
              tabClassName
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge !== null && (
              <span className="shrink-0">{tab.badge}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
