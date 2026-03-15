import { formatCurrency, formatDuration, toneClassName } from "../formatters";
import type { Service } from "../types";
import { CheckIcon, ClockIcon } from "./icons";

interface ServiceCardProps {
  service: Service;
  selected: boolean;
  onToggle: (serviceId: number) => void;
  viewMode: "grid" | "list";
}

export function ServiceCard({
  service,
  selected,
  onToggle,
  viewMode,
}: ServiceCardProps) {
  const isGrid = viewMode === "grid";

  return (
    <article
      className={`relative rounded-card-lg overflow-hidden bg-white shadow-card transition-shadow hover:shadow-card-hover ${
        selected ? "ring-2 ring-accent-green" : "border border-surface-border"
      } ${isGrid ? "" : "flex"}`}
    >
      {/* Visual area */}
      <div
        className={`relative overflow-hidden ${toneClassName(service.accent)} ${
          isGrid ? "h-32" : "w-28 flex-shrink-0"
        }`}
        style={{
          background: `radial-gradient(circle at top right, rgba(255,255,255,0.28), transparent 36%), linear-gradient(160deg, var(--tone-soft), var(--tone-main))`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />

        {/* Duration badge */}
        <span className="absolute top-2 left-2 z-10 px-2 py-1 rounded-lg bg-brand-800/80 text-white text-xs font-bold">
          {formatDuration(service.durationMinutes)}
        </span>

        {/* Promo badge */}
        {service.badge ? (
          <span className="absolute top-2 right-2 z-10 px-2 py-1 rounded-lg bg-amber-100/90 text-amber-800 text-xs font-bold">
            {service.badge}
          </span>
        ) : null}

        {/* Tagline overlay */}
        {isGrid && service.tagline ? (
          <p className="absolute left-3 right-3 bottom-2 z-10 text-white text-sm font-bold leading-snug line-clamp-2">
            {service.tagline}
          </p>
        ) : null}
      </div>

      {/* Body */}
      <div className={`flex flex-col gap-2 p-3 ${isGrid ? "" : "flex-1 min-w-0"}`}>
        <h3 className="font-heading text-sm font-bold text-brand-900 leading-snug line-clamp-2">
          {service.name}
        </h3>

        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
          {service.description}
        </p>

        {/* Meta: time + price */}
        <div className="flex items-center justify-between gap-2 mt-auto">
          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
            <ClockIcon width={13} height={13} />
            {service.durationMinutes} phút
          </span>
          <strong className="text-sm font-bold text-brand-700">
            {formatCurrency(service.price)}
          </strong>
        </div>

        {/* Select button */}
        <button
          className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-button text-xs font-bold transition-all active:scale-95 ${
            selected
              ? "bg-accent-green text-white"
              : "bg-brand-700 text-white shadow-sm hover:bg-brand-600"
          }`}
          onClick={() => onToggle(service.id)}
          type="button"
        >
          {selected ? (
            <>
              <CheckIcon width={14} height={14} />
              Đã chọn
            </>
          ) : (
            "Chọn"
          )}
        </button>
      </div>
    </article>
  );
}
