"use client";

import * as React from "react";
import { useState, useRef, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface MonthCalendarPickerProps {
  value: string; // "YYYY-MM" or "all"
  onChange: (value: string) => void;
  ticketMonths?: string[]; // List of "YYYY-MM" that have tickets (to show indicator dots)
  className?: string;
  ariaLabel?: string;
}

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const SHORT_MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

function stepMonth(currentYm: string, step: number): string {
  let date: Date;
  if (currentYm === "all" || !/^\d{4}-\d{2}$/.test(currentYm)) {
    date = new Date();
    if (step < 0) {
      date.setMonth(date.getMonth() + step);
    }
  } else {
    const [y, m] = currentYm.split("-").map(Number);
    date = new Date(y, m - 1 + step, 1);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function MonthCalendarPicker({
  value,
  onChange,
  ticketMonths = [],
  className,
  ariaLabel = "Filter kalender bulan",
}: MonthCalendarPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonthKey = `${currentYear}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const initialYear = useMemo(() => {
    if (value && /^\d{4}-\d{2}$/.test(value)) {
      return parseInt(value.slice(0, 4), 10);
    }
    return currentYear;
  }, [value, currentYear]);

  const [viewingYear, setViewingYear] = useState<number>(initialYear);

  // Sync viewingYear when value changes externally
  useEffect(() => {
    if (value && /^\d{4}-\d{2}$/.test(value)) {
      setViewingYear(parseInt(value.slice(0, 4), 10));
    }
  }, [value]);

  // Close popover on click outside or Escape
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const activeMonthsSet = useMemo(() => new Set(ticketMonths), [ticketMonths]);

  const displayLabel = useMemo(() => {
    if (value === "all") {
      return "Semua Bulan";
    }
    if (value && /^\d{4}-\d{2}$/.test(value)) {
      const [y, m] = value.split("-").map(Number);
      const monthName = MONTH_NAMES[m - 1] || "";
      return `${monthName} ${y}`;
    }
    return "Pilih Bulan";
  }, [value]);

  const handlePrev = () => {
    onChange(stepMonth(value, -1));
  };

  const handleNext = () => {
    onChange(stepMonth(value, 1));
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-block text-left w-full sm:w-auto", className)}
      aria-label={ariaLabel}
    >
      {/* Calendar Stepper / Trigger with Fixed Dimensions */}
      <div className="inline-flex items-center justify-between w-full sm:w-[240px] h-10 rounded-xl bg-gray-100/90 p-1 border border-gray-200/80 shadow-2xs">
        {/* Tombol Bulan Sebelumnya */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Bulan sebelumnya"
          title="Bulan sebelumnya"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-xs transition-all cursor-pointer shrink-0"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Tombol Kalender Utama (Membuka Popover Kalender) */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          className="flex-1 min-w-0 flex items-center justify-center gap-1.5 px-2 py-1 text-xs font-bold text-gray-800 hover:text-primary transition-colors cursor-pointer select-none"
        >
          <CalendarIcon size={14} className="text-primary shrink-0" />
          <span className="truncate text-center">{displayLabel}</span>
          {value === currentMonthKey && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" title="Bulan Ini" />
          )}
          <ChevronDown
            size={13}
            className={cn(
              "text-gray-500 transition-transform duration-200 shrink-0",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {/* Tombol Bulan Berikutnya */}
        <button
          type="button"
          onClick={handleNext}
          aria-label="Bulan berikutnya"
          title="Bulan berikutnya"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-xs transition-all cursor-pointer shrink-0"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Popover Kalender Grid Bulan */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Pilih bulan kalender"
          className="absolute left-0 top-full mt-2 w-72 sm:w-80 rounded-2xl bg-white border border-gray-200 shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header Kalender: Navigasi Tahun */}
          <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50/70 border-b border-gray-100">
            <button
              type="button"
              onClick={() => setViewingYear((y) => y - 1)}
              aria-label="Tahun sebelumnya"
              className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-xs transition-all cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-bold text-gray-900 tracking-tight">
              {viewingYear}
            </span>
            <button
              type="button"
              onClick={() => setViewingYear((y) => y + 1)}
              aria-label="Tahun berikutnya"
              className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-xs transition-all cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Grid 12 Bulan */}
          <div className="grid grid-cols-3 gap-1.5 p-3">
            {SHORT_MONTH_NAMES.map((monthShort, idx) => {
              const monthNum = String(idx + 1).padStart(2, "0");
              const ym = `${viewingYear}-${monthNum}`;
              const isSelected = value === ym;
              const isCurrent = ym === currentMonthKey;
              const hasTickets = activeMonthsSet.has(ym);

              return (
                <button
                  key={ym}
                  type="button"
                  onClick={() => {
                    onChange(ym);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "relative flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none",
                    isSelected
                      ? "bg-primary text-white shadow-xs"
                      : isCurrent
                      ? "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20"
                      : "hover:bg-gray-100 text-gray-700 hover:text-gray-900"
                  )}
                >
                  <span>{monthShort}</span>
                  {/* Indikator Titik Data Tiket */}
                  {hasTickets && (
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full mt-1",
                        isSelected ? "bg-white" : "bg-primary"
                      )}
                      title="Ada riwayat tiket pada bulan ini"
                    />
                  )}
                  {isCurrent && !isSelected && !hasTickets && (
                    <span className="text-[9px] font-normal text-primary mt-0.5 leading-none">
                      Kini
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer: Opsi Cepat */}
          <div className="flex items-center justify-between p-2.5 bg-gray-50/80 border-t border-gray-100 text-xs">
            <button
              type="button"
              onClick={() => {
                onChange(currentMonthKey);
                setViewingYear(currentYear);
                setIsOpen(false);
              }}
              className="text-primary hover:text-primary-dark font-semibold px-2 py-1 rounded-lg hover:bg-primary/5 transition-colors cursor-pointer"
            >
              Bulan Ini
            </button>

            <button
              type="button"
              onClick={() => {
                onChange("all");
                setIsOpen(false);
              }}
              className={cn(
                "font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1",
                value === "all"
                  ? "bg-primary text-white font-bold shadow-2xs"
                  : "text-gray-600 hover:bg-gray-200/80 hover:text-gray-900"
              )}
            >
              {value === "all" && <Check size={12} />}
              <span>Semua Bulan</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
