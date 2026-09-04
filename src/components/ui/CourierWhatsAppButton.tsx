"use client";

import React, { useState, useId, useEffect } from "react";
import { Check, Copy, ExternalLink, MessageCircle, X } from "lucide-react";
import {
  WHATSAPP_TEMPLATES,
  getDefaultTemplate,
  buildWhatsAppUrl,
  formatToWhatsAppPhone,
  WhatsAppMessageContext,
} from "@/utils/whatsapp";
import { Textarea } from "@/components/ui/Textarea";

export interface CourierWhatsAppButtonProps {
  phoneNumber: string;
  recipientName?: string;
  courierName?: string;
  ticketId?: string;
  address?: string;
  status?: string;
  variant?: "icon" | "compact" | "full";
  className?: string;
}

export function CourierWhatsAppButton({
  phoneNumber,
  recipientName,
  courierName = "Kurir UanginKuy",
  ticketId,
  address,
  status,
  variant = "icon",
  className = "",
}: CourierWhatsAppButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const context: WhatsAppMessageContext = {
    recipientName,
    courierName,
    ticketId,
    address,
    status,
  };

  const initialTemplate = getDefaultTemplate(status);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(initialTemplate.id);
  const [messageText, setMessageText] = useState<string>(() => initialTemplate.getMessage(context));

  // Reset or re-evaluate message when dialog opens or context changes
  const handleOpenDialog = () => {
    const template = WHATSAPP_TEMPLATES.find((t) => t.id === selectedTemplateId) || initialTemplate;
    setMessageText(template.getMessage(context));
    setIsOpen(true);
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = WHATSAPP_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setMessageText(template.getMessage(context));
    }
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API fails
    }
  };

  const formattedPhone = formatToWhatsAppPhone(phoneNumber);
  const waUrl = buildWhatsAppUrl(phoneNumber, messageText);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const dialogTitleId = useId();
  const dialogDescId = useId();

  if (!phoneNumber) return null;

  return (
    <>
      {/* Trigger Button */}
      {variant === "icon" && (
        <button
          type="button"
          onClick={handleOpenDialog}
          aria-label={`Chat WhatsApp dengan ${recipientName || "Nasabah"}`}
          title="Chat WhatsApp"
          className={`shrink-0 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-2xl flex items-center justify-center shadow-sm transition duration-150 cursor-pointer ${className}`}
        >
          <MessageCircle size={20} />
        </button>
      )}

      {variant === "compact" && (
        <button
          type="button"
          onClick={handleOpenDialog}
          aria-label={`Chat WhatsApp dengan ${recipientName || "Nasabah"}`}
          className={`inline-flex items-center space-x-2 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-2xl shadow-sm transition active:scale-95 cursor-pointer ${className}`}
        >
          <MessageCircle size={18} />
          <span>WhatsApp</span>
        </button>
      )}

      {variant === "full" && (
        <button
          type="button"
          onClick={handleOpenDialog}
          aria-label={`Chat WhatsApp dengan ${recipientName || "Nasabah"}`}
          className={`w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-2xl flex items-center justify-center space-x-2 shadow-sm transition active:scale-95 cursor-pointer ${className}`}
        >
          <MessageCircle size={20} />
          <span>Hubungi via WhatsApp</span>
        </button>
      )}

      {/* WhatsApp Dialog Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={dialogTitleId}
          aria-describedby={dialogDescId}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <MessageCircle size={22} />
                </div>
                <div>
                  <h3 id={dialogTitleId} className="font-bold text-gray-900 text-lg leading-tight">
                    Chat WhatsApp Nasabah
                  </h3>
                  <p id={dialogDescId} className="text-xs text-gray-500 mt-0.5">
                    Sesuaikan pesan sebelum membuka aplikasi WhatsApp
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Tutup dialog"
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Recipient Details Pill */}
            <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="text-gray-400 font-medium">Tujuan:</span>{" "}
                <strong className="text-gray-800">{recipientName || "Nasabah Anonim"}</strong>
                <span className="text-gray-500 ml-1.5 font-mono">({phoneNumber})</span>
              </div>
              {ticketId && (
                <span className="self-start sm:self-auto bg-primary/10 text-primary font-bold px-2.5 py-0.5 rounded-full text-[11px]">
                  Tiket #{ticketId}
                </span>
              )}
            </div>

            {/* Quick Template Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Pilihan Template Pesan
              </label>
              <div className="grid grid-cols-2 gap-2">
                {WHATSAPP_TEMPLATES.map((tmpl) => {
                  const isSelected = selectedTemplateId === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleSelectTemplate(tmpl.id)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50/70 text-emerald-900 font-semibold ring-1 ring-emerald-400"
                          : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium"
                      }`}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>{tmpl.emoji}</span>
                        <span className="truncate">{tmpl.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Editable Message Area */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="wa-message-textarea"
                  className="block text-xs font-bold text-gray-700 uppercase tracking-wider"
                >
                  Pesan yang Akan Dikirim
                </label>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="text-xs text-gray-500 hover:text-emerald-600 flex items-center space-x-1 transition font-medium"
                >
                  {copied ? (
                    <>
                      <Check size={13} className="text-emerald-600" />
                      <span className="text-emerald-600">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Salin teks</span>
                    </>
                  )}
                </button>
              </div>

              <Textarea
                id="wa-message-textarea"
                rows={5}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Tulis pesan untuk nasabah..."
                className="rounded-2xl border-gray-200 text-sm leading-relaxed p-3 focus-visible:ring-emerald-500 font-normal"
              />
              <p className="text-[11px] text-gray-400">
                Anda dapat mengubah teks di atas sesuai kebutuhan sebelum dikirim ke WhatsApp.
              </p>
            </div>

            {/* Dialog Actions */}
            <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 py-3 px-4 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition"
              >
                Batal
              </button>

              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="flex-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-md transition"
              >
                <MessageCircle size={18} />
                <span>Buka WhatsApp</span>
                <ExternalLink size={14} className="opacity-80" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
