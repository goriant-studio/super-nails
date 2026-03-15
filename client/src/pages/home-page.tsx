import { Link } from "react-router-dom";

import { useBooking } from "../booking-context";
import { BottomNav } from "../components/app-bottom-nav";
import { MobileShell } from "../components/MobileShell";
import { SectionHeader } from "../components/SectionHeader";
import {
  CalendarIcon,
  ChevronRightIcon,
  GlobeIcon,
  PhoneIcon,
  ShieldCheckIcon,
  StarIcon,
  TicketIcon,
} from "../components/icons";
import { formatCurrency, toneClassName } from "../formatters";
import { useT } from "../i18n/i18n-context";

export function HomePage() {
  const t = useT();
  const { data, selectedSalon, selectedServices, grandTotal } =
    useBooking();
  const featuredServices = data.services.slice(0, 4);
  const categoryHighlights = data.categories.slice(0, 3);

  const quickLinks = [
    {
      label: t("home.section_services"),
      description: t("nav.services"),
      to: "/services",
      icon: <TicketIcon width={22} height={22} />,
    },
    {
      label: t("nav.booking"),
      description: t("home.cta_book"),
      to: "/booking",
      icon: <ShieldCheckIcon width={22} height={22} />,
    },
    {
      label: t("home.section_salons"),
      description: t("salon.title"),
      to: "/salons",
      icon: <GlobeIcon width={22} height={22} />,
    },
  ];

  return (
    <MobileShell className="bg-surface-muted">
      {/* Header with gradient */}
      <section className="bg-gradient-to-b from-brand-700 to-brand-500 text-white px-4 pt-12 pb-8 rounded-b-[28px] shadow-lg">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-full bg-white/90 text-brand-700 shadow-lg">
            <span className="font-heading text-base font-bold">SN</span>
          </div>

          {/* Profile info */}
          <div className="flex-1 min-w-0">
            <h1 className="font-heading text-xl font-bold leading-tight">
              {t("home.hero_title")}
            </h1>
            <p className="text-white/75 text-sm font-medium mt-0.5">
              {t("home.hero_subtitle")}
            </p>
            <Link
              className="inline-flex items-center gap-1 text-white text-sm font-semibold mt-1"
              to="/booking"
            >
              {t("home.cta_book")}
              <ChevronRightIcon width={14} height={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Main content */}
      <main className="px-4 pb-24 -mt-4">
        {/* Quick actions */}
        <div className="bg-white rounded-card-lg shadow-card p-3 mb-4">
          <div className="grid grid-cols-3 gap-2">
            {quickLinks.map((link) => (
              <Link
                className="flex flex-col items-center gap-2 py-3 px-2 text-center rounded-card hover:bg-brand-50/50 transition-colors"
                key={link.label}
                to={link.to}
              >
                <span className="w-12 h-12 flex items-center justify-center rounded-full bg-brand-50 text-brand-700 shadow-sm">
                  {link.icon}
                </span>
                <strong className="text-sm font-bold text-brand-900 leading-tight">
                  {link.label}
                </strong>
                <small className="text-[11px] text-gray-400 leading-tight">
                  {link.description}
                </small>
              </Link>
            ))}
          </div>

          {/* Review banner */}
          <div className="flex items-center gap-3 mt-3 p-3 rounded-card bg-gradient-to-r from-blue-50 to-blue-100">
            <div className="w-14 h-14 flex-shrink-0 rounded-card bg-gradient-to-br from-rose-200 to-rose-400 shadow-inner" />
            <div className="flex-1 min-w-0">
              <strong className="block text-sm font-bold text-brand-700 leading-snug">
                {t("tour.feedback_title")}
              </strong>
              <div className="flex gap-1 mt-1.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} width={16} height={16} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Promo card */}
        <div className="relative rounded-card-lg overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800 text-white p-5 shadow-lg mb-5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <span className="inline-flex px-2.5 py-1 rounded-chip bg-white/15 text-[11px] font-bold uppercase tracking-wider mb-2">
            {t("home.section_services")}
          </span>
          <h2 className="font-heading text-lg font-bold leading-snug">
            {t("home.cta_book")}
          </h2>
          <p className="text-white/75 text-sm mt-1.5 leading-snug">
            {selectedSalon
              ? selectedSalon.shortAddress
              : t("home.hero_subtitle")}
          </p>
          <div className="mt-3 inline-flex px-3 py-1.5 rounded-card bg-white/15 font-heading text-base font-bold">
            {selectedServices.length ? formatCurrency(grandTotal) : formatCurrency(3000)}
          </div>
        </div>

        {/* Featured services */}
        <SectionHeader title={t("home.section_services")} />
        <div className="grid grid-cols-2 gap-3 mb-5">
          {featuredServices.map((service) => (
            <Link
              className={`rounded-card-lg overflow-hidden bg-white shadow-card hover:shadow-card-hover transition-shadow ${toneClassName(
                service.accent
              )}`}
              key={service.id}
              to="/services"
            >
              <div
                className="relative h-24"
                style={{
                  background: `radial-gradient(circle at top right, rgba(255,255,255,0.24), transparent 26%), linear-gradient(160deg, var(--tone-soft), var(--tone-main))`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
                <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-chip bg-white/20 text-white text-[10px] font-bold">
                  {service.badge || `${service.durationMinutes} min`}
                </span>
              </div>
              <div className="p-3">
                <strong className="block text-sm font-bold text-brand-800 leading-snug line-clamp-1">
                  {service.name}
                </strong>
                <span className="block text-sm font-semibold text-gray-500 mt-1">
                  {formatCurrency(service.price)}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Category highlights */}
        <SectionHeader title={t("nav.services")} />
        <div className="space-y-2 mb-5">
          {categoryHighlights.map((category) => (
            <Link
              className="flex items-center justify-between gap-3 p-4 bg-white rounded-card shadow-card hover:shadow-card-hover transition-shadow"
              key={category.id}
              to="/services"
            >
              <div className="flex-1 min-w-0">
                <strong className="block text-sm font-bold text-brand-900">
                  {category.name}
                </strong>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                  {category.teaser}
                </p>
              </div>
              <ChevronRightIcon width={18} height={18} className="text-gray-300 flex-shrink-0" />
            </Link>
          ))}
        </div>

        {/* Booking CTA */}
        <div className="bg-gradient-to-br from-brand-600 to-brand-800 text-white rounded-card-lg p-5 shadow-lg">
          <span className="inline-flex px-2.5 py-1 rounded-chip bg-white/15 text-[10px] font-bold uppercase tracking-wider mb-2">
            {t("nav.booking")}
          </span>
          <h2 className="font-heading text-lg font-bold leading-snug">
            {t("home.cta_book")}
          </h2>
          <p className="text-white/75 text-sm mt-1.5 leading-snug">
            {t("home.hero_subtitle")}
          </p>
          <Link
            className="mt-4 inline-flex items-center gap-2 px-5 py-3 rounded-button bg-white text-brand-700 font-bold shadow-md hover:bg-gray-50 active:scale-95 transition-all"
            to="/booking"
          >
            <CalendarIcon width={18} height={18} />
            {t("home.cta_book")}
          </Link>
        </div>
      </main>

      {/* Hotline FAB */}
      <a
        className="fixed bottom-20 right-4 z-30 max-w-lg flex items-center gap-2 px-4 py-2.5 rounded-chip bg-accent-green text-white font-bold text-sm shadow-lg hover:bg-green-600 active:scale-95 transition-all"
        href="tel:19000000"
      >
        <span>Hotline</span>
        <PhoneIcon width={16} height={16} />
      </a>
      <BottomNav active="home" />
    </MobileShell>
  );
}
