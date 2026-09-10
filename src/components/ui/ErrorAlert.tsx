import { AlertCircle } from "lucide-react";

interface ErrorAlertProps {
  message: string | string[] | null | undefined;
  id?: string;
  className?: string;
}

export function ErrorAlert({ message, id, className }: ErrorAlertProps) {
  if (!message || (Array.isArray(message) && message.length === 0)) return null;

  const list = Array.isArray(message) ? message : [message];

  return (
    <div
      id={id}
      role="alert"
      aria-live="polite"
      className={`flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 ${className ?? ""}`}
    >
      <AlertCircle className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
      {list.length === 1 ? (
        <span className="leading-relaxed">{list[0]}</span>
      ) : (
        <ul className="space-y-1">
          {list.map((item, i) => (
            <li key={i} className="leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
