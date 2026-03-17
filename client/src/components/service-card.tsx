import { formatCurrency, formatDuration, toneClassName } from "../formatters";
import { useT, useLocale } from "../i18n/i18n-hooks";
import { localized } from "../locale-helpers";
import { getServiceImage } from "../service-media";
import type { Service } from "../types";
import { CheckIcon, ClockIcon, CloseIcon } from "./icons";

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
  const t = useT();
  const { locale } = useLocale();
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
          isGrid ? "h-36" : "w-32 flex-shrink-0"
        }`}
        style={{
          background: `radial-gradient(circle at top right, rgba(255,255,255,0.28), transparent 36%), linear-gradient(160deg, var(--tone-soft), var(--tone-main))`,
        }}
      >
        <img
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          src={getServiceImage(service)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900/85 via-brand-900/30 to-white/10" />

        {/* Duration badge */}
        <span className="absolute top-2 left-2 z-10 px-2 py-1 rounded-lg bg-brand-800/80 text-white text-xs font-bold">
          {formatDuration(service.durationMinutes)}
        </span>

        {/* Promo badge */}
        {localized(service, "badge", locale) ? (
          <span className="absolute top-2 right-2 z-10 px-2 py-1 rounded-lg bg-amber-100/90 text-amber-800 text-xs font-bold">
            {localized(service, "badge", locale)}
          </span>
        ) : null}

        {/* Tagline overlay */}
        {isGrid && localized(service, "tagline", locale) ? (
          <div className="absolute inset-x-3 bottom-3 z-10 flex items-end justify-between gap-2">
            <p className="max-w-[70%] text-white text-sm font-bold leading-snug line-clamp-2">
              {localized(service, "tagline", locale)}
            </p>
            <span className="inline-flex rounded-lg bg-white/92 px-2.5 py-1 text-xs font-bold text-brand-900 shadow-sm">
              {formatCurrency(service.price)}
            </span>
          </div>
        ) : (
          <span className="absolute bottom-3 right-3 z-10 inline-flex rounded-lg bg-white/92 px-2.5 py-1 text-xs font-bold text-brand-900 shadow-sm">
            {formatCurrency(service.price)}
          </span>
        )}
      </div>

      {/* Body */}
      <div className={`flex flex-col gap-2 p-3 ${isGrid ? "" : "flex-1 min-w-0"}`}>
        <h3 className="font-heading text-sm font-bold text-brand-900 leading-snug line-clamp-2">
          {localized(service, "name", locale)}
        </h3>

        {!isGrid && localized(service, "tagline", locale) ? (
          <p className="text-xs font-semibold text-brand-600 line-clamp-2">
            {localized(service, "tagline", locale)}
          </p>
        ) : null}

        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
          {localized(service, "description", locale)}
        </p>

        {/* Meta: time + price */}
        <div className="flex items-center justify-between gap-2 mt-auto">
          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
            <ClockIcon width={13} height={13} />
            {formatDuration(service.durationMinutes)}
          </span>
          <span className="text-xs font-medium text-gray-400 line-clamp-1 text-right">
            {localized(service, "badge", locale) || localized(service, "tagline", locale)}
          </span>
        </div>

        {/* Select / Deselect button */}
        <button
          className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-button text-xs font-bold transition-all active:scale-95 ${
            selected
              ? "bg-accent-rose/10 text-accent-rose border border-accent-rose/30 hover:bg-accent-rose/20"
              : "bg-brand-700 text-white shadow-sm hover:bg-brand-600"
          }`}
          onClick={() => onToggle(service.id)}
          type="button"
        >
          {selected ? (
            <>
              <CloseIcon width={14} height={14} />
              {t("services.deselect")}
            </>
          ) : (
            <>
              <CheckIcon width={14} height={14} />
              {t("services.select")}
            </>
          )}
        </button>
      </div>
    </article>
  );
}
