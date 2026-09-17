"use client";

import * as React from "react";
import { motion } from "framer-motion";
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
  indicatorClassName?: string;
  layoutId?: string;
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
  activeClassName = "text-primary",
  inactiveClassName = "text-gray-600 hover:text-gray-900 hover:bg-black/5",
  indicatorClassName,
  layoutId,
  fullWidth = true,
  size = "md",
}: TabsNavProps<T>) {
  const instanceId = React.useId();
  const activeIndicatorId = layoutId || `tabs-indicator-${instanceId}`;

  const sizeStyles = {
    sm: "py-1.5 px-3 text-xs rounded-md",
    md: "py-2.5 px-4 text-sm rounded-md",
    lg: "py-3 px-4 text-sm rounded-md",
  };

  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        "relative flex rounded-lg bg-gray-200/80 border border-gray-300/80 p-1 shadow-xs",
        className
      )}
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
              "relative flex items-center justify-center font-bold transition-colors cursor-pointer select-none",
              fullWidth && "flex-1 text-center",
              sizeStyles[size],
              isActive ? activeClassName : inactiveClassName,
              tab.disabled && "opacity-50 cursor-not-allowed",
              tabClassName
            )}
          >
            {isActive && (
              <motion.span
                layoutId={activeIndicatorId}
                className={cn(
                  "absolute inset-0 rounded-md bg-white shadow-sm ring-1 ring-black/5",
                  indicatorClassName
                )}
                transition={{
                  type: "spring",
                  stiffness: 450,
                  damping: 35,
                }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-2">
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge !== null && (
                <span className="shrink-0">{tab.badge}</span>
              )}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
