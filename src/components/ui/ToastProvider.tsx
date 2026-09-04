"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

type ToastType = 'success' | 'error';
interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (msg: { type: ToastType; message: string }) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback(({ type, message }: { type: ToastType; message: string }) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-24 sm:bottom-4 left-4 right-4 sm:right-auto sm:w-96 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`animate-in slide-in-from-bottom-5 fade-in duration-300 flex items-start gap-3 rounded-xl border p-4 shadow-lg pointer-events-auto ${
              t.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
            role="alert"
          >
            {t.type === 'error' ? (
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 size={20} className="shrink-0 mt-0.5 text-emerald-600" />
            )}
            <p className="text-sm font-semibold flex-1">{t.message}</p>
            <button
              onClick={() => removeToast(t.id)}
              className="ml-auto shrink-0 opacity-50 hover:opacity-100 transition-opacity"
              aria-label="Tutup notifikasi"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context.toast;
}
