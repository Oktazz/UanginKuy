"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

export interface CustomSelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface CustomSelectGroup {
  label: string;
  options: CustomSelectOption[];
}

export interface CustomSelectProps {
  id?: string;
  name?: string;
  options?: Array<string | CustomSelectOption>;
  groups?: CustomSelectGroup[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
}

export function CustomSelect({
  id,
  name,
  options = [],
  groups,
  value,
  onChange,
  placeholder = "Pilih opsi...",
  className = "",
  triggerClassName = "",
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    placement: "bottom" | "top";
  }>({
    left: 0,
    width: 0,
    placement: "bottom",
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const generatedId = useId();
  const selectId = id ?? `custom-select-${generatedId}`;
  const listboxId = `${selectId}-listbox`;

  useEffect(() => {
    setMounted(true);
  }, []);

  const normalizedOptions = useMemo(
    () =>
      options.map((option) =>
        typeof option === "string" ? { value: option, label: option } : option,
      ),
    [options],
  );
  const normalizedGroups = useMemo(
    () =>
      groups && groups.length > 0
        ? groups
        : [{ label: "", options: normalizedOptions }],
    [groups, normalizedOptions],
  );
  const flatOptions = useMemo(
    () => normalizedGroups.flatMap((group) => group.options),
    [normalizedGroups],
  );
  const selectedOption = useMemo(
    () => flatOptions.find((option) => option.value === value),
    [flatOptions, value],
  );

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownMaxHeight = 320;
    const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800;
    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1024;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    const placeAbove = spaceBelow < 220 && spaceAbove > spaceBelow;
    const width = rect.width > 0 ? rect.width : (dropdownRef.current?.offsetWidth || 200);
    const left =
      rect.width > 0
        ? Math.max(8, Math.min(rect.left, viewportWidth - width - 8))
        : 0;

    setMenuStyle({
      top: placeAbove ? undefined : rect.bottom + 6,
      bottom: placeAbove ? viewportHeight - rect.top + 6 : undefined,
      left,
      width,
      placement: placeAbove ? "top" : "bottom",
    });
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Keep dropdown positioned properly during scroll or resize
  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleScrollOrResize = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800;
      if (rect.bottom < 0 || rect.top > viewportHeight) {
        setIsOpen(false);
        return;
      }
      updatePosition();
    };

    window.addEventListener("scroll", handleScrollOrResize, { passive: true, capture: true });
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen || flatOptions.length === 0) return;

    const frame = requestAnimationFrame(() => {
      const el = optionRefs.current[activeIndex];
      if (el) {
        el.focus({ preventScroll: true });
        if (typeof el.scrollIntoView === "function") {
          el.scrollIntoView({ block: "nearest" });
        }
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [activeIndex, flatOptions.length, isOpen]);

  const openDropdown = (preferredIndex?: number) => {
    if (disabled || flatOptions.length === 0) return;

    const selectedIndex = flatOptions.findIndex((option) => option.value === value);
    setActiveIndex(
      preferredIndex ??
        (selectedIndex >= 0 ? selectedIndex : 0)
    );
    updatePosition();
    setIsOpen(true);
  };

  const closeDropdown = (restoreFocus = false) => {
    setIsOpen(false);

    if (restoreFocus) {
      requestAnimationFrame(() => triggerRef.current?.focus());
    }
  };

  const selectOption = (option: CustomSelectOption) => {
    onChange(option.value);
    closeDropdown(true);
  };

  const moveActiveOption = (nextIndex: number) => {
    const boundedIndex =
      (nextIndex + flatOptions.length) % flatOptions.length;
    setActiveIndex(boundedIndex);
  };

  const hasExplicitHeight = triggerClassName.includes("h-");

  const portalTarget =
    mounted && typeof document !== "undefined"
      ? (dropdownRef.current?.closest('[role="dialog"]') as HTMLElement) || document.body
      : null;

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        id={selectId}
        ref={triggerRef}
        type="button"
        role="combobox"
        disabled={disabled}
        aria-disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => {
          if (disabled) return;
          if (isOpen) {
            closeDropdown();
          } else {
            openDropdown();
          }
        }}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            openDropdown();
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            openDropdown(
              value
                ? undefined
                : Math.max(flatOptions.length - 1, 0)
            );
          }
        }}
        className={`w-full flex items-center justify-between gap-3 px-3 border rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
          ${hasExplicitHeight ? "" : "h-12"}
          ${
            disabled
              ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60"
              : isOpen
              ? "bg-white border-primary ring-2 ring-primary/20"
              : "bg-white border-gray-300 hover:border-gray-300"
          }
          ${!value && !disabled ? "text-gray-500" : !disabled ? "text-gray-900" : ""}
          ${triggerClassName}
        `}
      >
        <span className="min-w-0 flex-1 text-left">
          <span className="block truncate">
            {selectedOption?.label ?? placeholder}
          </span>
          {selectedOption?.description && (
            <span className="mt-0.5 block truncate text-xs font-medium text-gray-500">
              {selectedOption.description}
            </span>
          )}
        </span>
        <ChevronDown
          size={18}
          aria-hidden="true"
          className={`shrink-0 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          } ${disabled ? "opacity-40" : ""}`}
        />
      </button>

      {isOpen &&
        portalTarget &&
        createPortal(
          <div
            id={listboxId}
            ref={menuRef}
            role="listbox"
            aria-labelledby={selectId}
            style={{
              position: "fixed",
              left: `${menuStyle.left}px`,
              width: `${menuStyle.width}px`,
              ...(menuStyle.top !== undefined ? { top: `${menuStyle.top}px` } : {}),
              ...(menuStyle.bottom !== undefined ? { bottom: `${menuStyle.bottom}px` } : {}),
              zIndex: 9999,
            }}
            className={`overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl duration-200 animate-in fade-in ${
              menuStyle.placement === "top"
                ? "slide-in-from-bottom-2"
                : "slide-in-from-top-2"
            }`}
          >
            <div className="max-h-72 overflow-y-auto overscroll-contain p-2">
              {normalizedGroups.map((group, groupIndex) => {
                const firstOptionIndex = normalizedGroups
                  .slice(0, groupIndex)
                  .reduce((total, currentGroup) => total + currentGroup.options.length, 0);

                return (
                  <div
                    key={group.label || `group-${groupIndex}`}
                    role={group.label ? "group" : undefined}
                    aria-label={group.label || undefined}
                    className={groupIndex > 0 ? "mt-2 border-t border-gray-100 pt-2" : ""}
                  >
                    {group.label && (
                      <div className="px-3 pb-1.5 pt-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-gray-400">
                        {group.label}
                      </div>
                    )}
                    <div className="space-y-1">
                      {group.options.map((option, optionIndex) => {
                        const flatIndex = firstOptionIndex + optionIndex;
                        const isSelected = value === option.value;

                        return (
                          <button
                            key={option.value}
                            ref={(element) => {
                              optionRefs.current[flatIndex] = element;
                            }}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            tabIndex={activeIndex === flatIndex ? 0 : -1}
                            onFocus={() => setActiveIndex(flatIndex)}
                            onClick={() => selectOption(option)}
                            onKeyDown={(event) => {
                              if (event.key === "ArrowDown") {
                                event.preventDefault();
                                moveActiveOption(flatIndex + 1);
                              } else if (event.key === "ArrowUp") {
                                event.preventDefault();
                                moveActiveOption(flatIndex - 1);
                              } else if (event.key === "Home") {
                                event.preventDefault();
                                setActiveIndex(0);
                              } else if (event.key === "End") {
                                event.preventDefault();
                                setActiveIndex(flatOptions.length - 1);
                              } else if (event.key === "Escape") {
                                event.preventDefault();
                                closeDropdown(true);
                              } else if (event.key === "Tab") {
                                closeDropdown();
                              }
                            }}
                            className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40
                              ${isSelected ? "bg-primary/10 text-primary" : "text-gray-700 hover:bg-gray-50 focus:bg-gray-50"}
                            `}
                          >
                            <span className="min-w-0 flex-1">
                              <span className={`block truncate text-sm ${isSelected ? "font-bold" : "font-semibold"}`}>
                                {option.label}
                              </span>
                              {option.description && (
                                <span className="mt-0.5 block truncate text-xs font-medium text-gray-500">
                                  {option.description}
                                </span>
                              )}
                            </span>
                            {isSelected && (
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                                <Check size={14} aria-hidden="true" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>,
          portalTarget,
        )}
    </div>
  );
}
