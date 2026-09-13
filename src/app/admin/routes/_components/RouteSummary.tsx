import type { LucideIcon } from "lucide-react";

export type SummaryCard = {
  label: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
  color: string;
};

export function RouteSummary({ cards }: { cards: SummaryCard[] }) {
  return (
    <section
      aria-label="Ringkasan operasional"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article
            key={card.label}
            className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-surface p-4 shadow-sm"
          >
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.color}`}
            >
              <Icon size={21} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
                {card.label}
              </p>
              <p className="mt-0.5 text-xl font-black text-gray-900">
                {card.value}
              </p>
              <p className="truncate text-xs font-medium text-gray-500">
                {card.detail}
              </p>
            </div>
          </article>
        );
      })}
    </section>
  );
}