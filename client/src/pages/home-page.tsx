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
import { formatCurrency, formatDuration } from "../formatters";
import { useT, useLocale } from "../i18n/i18n-hooks";
import { localized } from "../locale-helpers";
import { getServiceImage, pickServices } from "../service-media";

export function HomePage() {
  const t = useT();
  const { locale } = useLocale();
  const { data, selectedSalon, selectedServices, grandTotal } =
    useBooking();
  const heroServices = pickServices(data.services, [14, 7, 9], 3);
  const featuredServices = pickServices(data.services, [14, 7, 11, 13], 4);
  const recentLooks = pickServices(data.services, [6, 15, 3, 16], 4);
  const categoryHighlights = data.categories.slice(0, 3).map((category) => {
    const services = data.services.filter((service) => service.categoryId === category.id);

    return {
      ...category,
      preview: services[0],
      serviceCount: services.length,
    };
  });
  const spotlightService = heroServices[0];
  const reviewVisual = recentLooks[0] ?? featuredServices[0];

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
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-900 text-white px-4 pt-12 pb-8 rounded-b-[32px] shadow-lg">
        <div className="absolute -top-14 right-0 h-48 w-48 rounded-full bg-brand-300/20 blur-2xl" />
        <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-accent-rose/25 blur-2xl" />

        <div className="relative z-10 flex items-start gap-3">
          <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-full bg-white/92 text-brand-700 shadow-lg">
            <span className="font-heading text-base font-bold">SN</span>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="font-heading text-[1.6rem] font-bold leading-tight">
              {t("home.hero_title")}
            </h1>
            <p className="mt-1 text-sm text-white/75">
              {t("home.hero_subtitle")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
              <span className="rounded-chip bg-white/12 px-3 py-1.5">
                {selectedSalon ? selectedSalon.shortAddress : "Q7 + Da Nang"}
              </span>
              <span className="rounded-chip bg-white/12 px-3 py-1.5">
                {t("home.stats_catalog", { count: String(data.services.length) })}
              </span>
              <span className="inline-flex items-center gap-1 rounded-chip bg-white/12 px-3 py-1.5">
                <StarIcon width={12} height={12} />
                5.0 / 5
              </span>
            </div>
          </div>
        </div>

        {spotlightService ? (
          <div className="relative z-10 mt-5 grid grid-cols-[1.2fr,0.8fr] gap-3">
            <Link
              className="group relative min-h-[236px] overflow-hidden rounded-[26px] border border-white/10 shadow-card"
              to="/services"
            >
              <img
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                src={getServiceImage(spotlightService)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-900 via-brand-900/35 to-transparent" />
              <span className="absolute left-3 top-3 inline-flex rounded-chip bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em]">
                {localized(spotlightService, "badge", locale) || t("home.section_services")}
              </span>
              <div className="absolute inset-x-4 bottom-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65">
                  {t("nav.services")}
                </p>
                <h2 className="mt-1 font-heading text-xl font-bold leading-tight">
                  {localized(spotlightService, "name", locale)}
                </h2>
                <p className="mt-1 text-sm text-white/80">
                  {localized(spotlightService, "tagline", locale)}
                </p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-chip bg-white px-4 py-2 text-sm font-bold text-brand-800 shadow-sm">
                  {t("home.cta_book")}
                  <ChevronRightIcon width={14} height={14} />
                </div>
              </div>
            </Link>

            <div className="grid gap-3">
              {heroServices.slice(1).map((service) => (
                <Link
                  className="group relative min-h-[112px] overflow-hidden rounded-card-lg border border-white/10 bg-white/10 shadow-card"
                  key={service.id}
                  to="/services"
                >
                  <img
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    src={getServiceImage(service)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-900/90 via-brand-900/28 to-transparent" />
                  <div className="absolute inset-x-3 bottom-3">
                    <strong className="block text-sm font-bold text-white line-clamp-2">
                      {localized(service, "name", locale)}
                    </strong>
                    <span className="mt-1 inline-flex rounded-chip bg-white/20 px-2 py-1 text-[11px] font-semibold text-white/85">
                      {formatCurrency(service.price)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* Main content */}
      <main className="px-4 pb-24 -mt-4">
        {/* Quick actions */}
        <div className="bg-white/95 backdrop-blur rounded-card-lg shadow-card p-3 mb-5">
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
          <div className="flex items-center gap-3 mt-3 p-3 rounded-card bg-gradient-to-r from-brand-50 via-white to-rose-50 border border-surface-border">
            {reviewVisual ? (
              <img
                alt=""
                aria-hidden="true"
                className="h-16 w-16 flex-shrink-0 rounded-card object-cover shadow-sm"
                loading="lazy"
                src={getServiceImage(reviewVisual)}
              />
            ) : (
              <div className="w-16 h-16 flex-shrink-0 rounded-card bg-gradient-to-br from-rose-200 to-rose-400 shadow-inner" />
            )}
            <div className="flex-1 min-w-0">
              <strong className="block text-sm font-bold text-brand-700 leading-snug">
                {t("tour.feedback_title")}
              </strong>
              <div className="flex gap-1 mt-1.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} width={16} height={16} />
                ))}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {t("home.stats_catalog", { count: String(data.services.length) })}
              </p>
            </div>
          </div>
        </div>

        {/* Promo card */}
        <div className="relative rounded-card-lg overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white p-5 shadow-lg mb-6">
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
            {selectedServices.length
              ? formatCurrency(grandTotal)
              : formatCurrency(spotlightService?.price ?? 3000)}
          </div>
        </div>

        {/* Featured services */}
        <SectionHeader
          title={t("home.section_services")}
          action={
            <Link className="text-xs font-bold text-brand-600" to="/services">
              {t("home.view_all")}
            </Link>
          }
        />
        <div className="grid grid-cols-2 gap-3 mb-6">
          {featuredServices.map((service) => (
            <Link
              className="group rounded-card-lg overflow-hidden bg-white shadow-card hover:shadow-card-hover transition-shadow"
              key={service.id}
              to="/services"
            >
              <div className="relative h-32 overflow-hidden">
                <img
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  src={getServiceImage(service)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-900/85 via-brand-900/16 to-transparent" />
                <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-chip bg-white/18 text-white text-[10px] font-bold">
                  {localized(service, "badge", locale) || formatDuration(service.durationMinutes)}
                </span>
                <span className="absolute right-2 bottom-2 z-10 rounded-chip bg-white/92 px-2.5 py-1 text-[11px] font-bold text-brand-900">
                  {formatCurrency(service.price)}
                </span>
              </div>
              <div className="p-3">
                <strong className="block text-sm font-bold text-brand-800 leading-snug line-clamp-1">
                  {localized(service, "name", locale)}
                </strong>
                <p className="mt-1 text-xs text-gray-500 leading-snug line-clamp-2">
                  {localized(service, "tagline", locale)}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <SectionHeader title={t("home.section_recent")} />
        <div className="grid grid-cols-2 gap-3 mb-6">
          {recentLooks.map((service, index) => (
            <Link
              className={`group overflow-hidden rounded-card-lg bg-white shadow-card hover:shadow-card-hover transition-shadow ${
                index === 0 ? "col-span-2" : ""
              }`}
              key={service.id}
              to="/services"
            >
              <div className={`relative overflow-hidden ${index === 0 ? "h-40" : "h-28"}`}>
                <img
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  src={getServiceImage(service)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-900/85 via-brand-900/18 to-transparent" />
                <span className="absolute top-3 left-3 z-10 rounded-chip bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
                  {formatDuration(service.durationMinutes)}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <strong className="block text-sm font-bold text-brand-900 line-clamp-1">
                      {localized(service, "name", locale)}
                    </strong>
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                      {localized(service, "description", locale)}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-brand-700">
                    {formatCurrency(service.price)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Category highlights */}
        <SectionHeader title={t("nav.services")} />
        <div className="space-y-3 mb-6">
          {categoryHighlights.map((category) => (
            <Link
              className="grid grid-cols-[1fr,86px] items-center gap-3 p-3.5 bg-white rounded-card-lg shadow-card hover:shadow-card-hover transition-shadow"
              key={category.id}
              to="/services"
            >
              <div className="flex-1 min-w-0">
                <strong className="block text-sm font-bold text-brand-900">
                  {localized(category, "name", locale)}
                </strong>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                  {localized(category, "teaser", locale)}
                </p>
                <span className="mt-2 inline-flex rounded-chip bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-600">
                  {locale === "vi"
                    ? `${category.serviceCount} dịch vụ`
                    : `${category.serviceCount} services`}
                </span>
              </div>
              <div className="relative h-20 overflow-hidden rounded-card">
                {category.preview ? (
                  <img
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                    src={getServiceImage(category.preview)}
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-900/70 via-brand-900/10 to-transparent" />
                <ChevronRightIcon
                  width={18}
                  height={18}
                  className="absolute right-2 top-2 text-white"
                />
              </div>
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
            {selectedServices.length
              ? `${selectedServices.length} ${t("services.selected")} • ${formatCurrency(grandTotal)}`
              : t("home.hero_subtitle")}
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
