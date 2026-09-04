"use client";

import { useEffect, useId, useRef, useState } from "react";
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const generatedId = useId();
  const selectId = id ?? `custom-select-${generatedId}`;
  const listboxId = `${selectId}-listbox`;

  const normalizedOptions = options.map((option) =>
    typeof option === "string"
      ? { value: option, label: option }
      : option
  );
  const normalizedGroups =
    groups && groups.length > 0
      ? groups
      : [{ label: "", options: normalizedOptions }];
  const flatOptions = normalizedGroups.flatMap((group) => group.options);
  const selectedOption = flatOptions.find((option) => option.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen || flatOptions.length === 0) return;

    const frame = requestAnimationFrame(() => {
      optionRefs.current[activeIndex]?.focus();
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
              : "bg-white border-gray-300 hover:border-gray-400"
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

      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          aria-labelledby={selectId}
          className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl animate-in fade-in slide-in-from-top-2 duration-200"
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
        </div>
      )}
    </div>
  );
}
