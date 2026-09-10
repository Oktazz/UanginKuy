"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, MapPin, XCircle } from "lucide-react";
import { formatIndonesianDateTime } from "@/utils/date";
import type { CancelledTicket } from "./types";

interface CancellationBellProps {
  cancelledTickets: CancelledTicket[];
}

export function CancellationBell({ cancelledTickets }: CancellationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const count = cancelledTickets.length;

  return (
    <div ref={containerRef} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Notifikasi pembatalan (${count})`}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-surface text-gray-600 shadow-sm transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-[10px] font-extrabold text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="region"
          aria-label="Daftar tiket dibatalkan"
          className="absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
        >
          <div className="border-b border-gray-100 bg-gray-50/70 px-4 py-3">
            <p className="text-sm font-extrabold text-gray-900">
              Tiket Dibatalkan
            </p>
            <p className="text-xs font-medium text-gray-500">
              {count > 0
                ? `${count} tiket dilepas dari rute`
                : "Tidak ada pembatalan"}
            </p>
          </div>

          {count === 0 ? (
            <div className="px-4 py-10 text-center">
              <XCircle size={28} className="mx-auto text-gray-200" />
              <p className="mt-3 text-sm font-semibold text-gray-500">
                Tidak ada pembatalan
              </p>
            </div>
          ) : (
            <ul className="max-h-80 divide-y divide-gray-100 overflow-y-auto">
              {cancelledTickets.map((ticket) => (
                <li key={ticket.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-gray-900">
                      {ticket.recipient_name}
                    </p>
                    <span className="mt-0.5 truncate font-mono text-[10px] text-gray-400">
                      #
                      {ticket.short_id ||
                        ticket.id.substring(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                    <MapPin size={11} className="shrink-0" />
                    <span className="truncate">{ticket.full_address}</span>
                  </div>
                  <p className="mt-1 text-[11px] font-medium text-gray-400">
                    {ticket.updated_at
                      ? formatIndonesianDateTime(ticket.updated_at)
                      : "-"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}