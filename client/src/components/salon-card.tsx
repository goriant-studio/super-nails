import { formatDistance, toneClassName } from "../formatters";
import type { Salon } from "../types";
import {
  CarIcon,
  CheckIcon,
  ChevronRightIcon,
  MapPinIcon,
  StarIcon,
} from "./icons";

interface SalonCardProps {
  salon: Salon;
  selected: boolean;
  onSelect: (salonId: number) => void;
}

export function SalonCard({ salon, selected, onSelect }: SalonCardProps) {
  return (
    <article
      className={`relative rounded-card-lg bg-white overflow-hidden shadow-card transition-shadow hover:shadow-card-hover ${
        selected ? "ring-2 ring-brand-600" : "border border-surface-border"
      }`}
    >
      {/* Travel time badge */}
      <div className="absolute top-0 left-0 px-3 py-1.5 rounded-br-card bg-accent-green text-white text-xs font-bold z-10">
        {salon.travelMinutes} phút
      </div>

      {/* Hero image area */}
      <div
        className={`relative h-36 ${toneClassName(salon.heroTone)}`}
        style={{
          background: `radial-gradient(circle at top right, rgba(255,255,255,0.28), transparent 36%), linear-gradient(160deg, var(--tone-soft), var(--tone-main))`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
        <span className="absolute left-3 bottom-2 z-10 text-white text-sm font-bold">
          {salon.gallery[0]}
        </span>

        {/* Thumbnails */}
        <div className="absolute right-2 bottom-2 z-10 flex gap-1">
          {salon.gallery.slice(1, 3).map((label) => (
            <div
              key={label}
              className={`w-14 h-14 rounded-lg overflow-hidden ${toneClassName(
                salon.heroTone
              )} flex items-center justify-center text-white text-[10px] font-bold`}
              style={{
                background: `linear-gradient(160deg, var(--tone-soft), var(--tone-main))`,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="p-4">
        <h3 className="font-heading text-base font-bold text-brand-900 leading-snug">
          {salon.name}
        </h3>

        <p className="flex items-start gap-1.5 mt-1.5 text-gray-500 text-sm leading-snug">
          <MapPinIcon width={16} height={16} className="flex-shrink-0 mt-0.5" />
          <span>
            {salon.street}, {salon.district}, {salon.city}
          </span>
        </p>

        {salon.note ? (
          <p className="mt-1 text-gray-400 text-sm italic">{salon.note}</p>
        ) : null}

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-chip bg-brand-50 text-brand-600 text-xs font-semibold">
            <MapPinIcon width={13} height={13} />
            {formatDistance(salon.distanceKm)}
          </span>
          {salon.parking ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-chip bg-gray-100 text-gray-600 text-xs font-semibold">
              <CarIcon width={13} height={13} />
              Ô tô
            </span>
          ) : null}
          {salon.premium ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-chip bg-accent-gold-light text-amber-700 text-xs font-semibold">
              <StarIcon width={13} height={13} />
              Premium
            </span>
          ) : null}
        </div>

        {/* Select button */}
        <button
          className={`w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-button text-sm font-bold transition-all active:scale-[0.98] ${
            selected
              ? "bg-accent-green text-white"
              : "bg-brand-700 text-white shadow-button hover:bg-brand-600"
          }`}
          onClick={() => onSelect(salon.id)}
          type="button"
        >
          {selected ? (
            <>
              <CheckIcon width={16} height={16} />
              Đã chọn salon
            </>
          ) : (
            <>
              Chọn salon
              <ChevronRightIcon width={16} height={16} />
            </>
          )}
        </button>
      </div>
    </article>
  );
}
