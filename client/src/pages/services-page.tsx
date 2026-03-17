import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useBooking } from "../booking-context";
import { AppHeader } from "../components/AppHeader";
import { FilterChip } from "../components/FilterChip";
import { MobileShell } from "../components/MobileShell";
import { ServiceCard } from "../components/service-card";
import { StickySummaryBar } from "../components/StickySummaryBar";
import { CheckIcon, SearchIcon, StarIcon } from "../components/icons";
import { formatCurrency } from "../formatters";
import { SectionHeader } from "../components/SectionHeader";
import { useT, useLocale } from "../i18n/i18n-hooks";
import { localized } from "../locale-helpers";
import { getServiceImage, pickServices } from "../service-media";

export function ServicesPage() {
  const navigate = useNavigate();
  const t = useT();
  const { locale } = useLocale();
  const {
    data,
    selectedServiceIds,
    selectedServices,
    subtotal,
    taxAmount,
    tipAmount,
    grandTotal,
    needsConsultation,
    toggleService,
    toggleConsultation,
  } = useBooking();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const categorySlugById = useMemo(
    () => new Map(data.categories.map((category) => [category.id, category.slug])),
    [data.categories]
  );

  const filteredServices = useMemo(() => {
    return data.services.filter((service) => {
      const matchesCategory =
        activeCategory === "all" || categorySlugById.get(service.categoryId) === activeCategory;
      const matchesSearch =
        !normalizedSearch ||
        `${service.name} ${service.description} ${service.tagline} ${service.nameEn || ""} ${service.nameVi || ""} ${service.descriptionEn || ""} ${service.descriptionVi || ""}`
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, categorySlugById, data.services, normalizedSearch]);

  const visibleCategories = useMemo(() => {
    return data.categories.filter((category) => {
      return filteredServices.some((service) => service.categoryId === category.id);
    });
  }, [data.categories, filteredServices]);

  const spotlightServices = pickServices(filteredServices, [14, 7, 11], 3);

  return (
    <MobileShell>
      <AppHeader title={t("services.title")} />

      <main className="px-4 py-4 pb-40">
        <section className="relative overflow-hidden rounded-[28px] bg-brand-900 text-white p-4 shadow-lg">
          <div className="absolute -top-12 right-0 h-40 w-40 rounded-full bg-brand-300/20 blur-2xl" />
          <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-accent-rose/25 blur-2xl" />

          <div className="relative z-10">
            <span className="inline-flex rounded-chip bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/90">
              {t("services.hero_eyebrow")}
            </span>
            <h2 className="mt-3 font-heading text-2xl font-bold leading-tight">
              {t("services.title")}
            </h2>
            <p className="mt-2 text-sm text-white/70">
              {t("services.hero_subtitle")}
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold">
              <span className="rounded-chip bg-white/12 px-3 py-1.5">
                {t("services.available_count", { count: String(filteredServices.length) })}
              </span>
              <span className="rounded-chip bg-white/12 px-3 py-1.5">
                {selectedServices.length} {t("services.selected")}
              </span>
              <span className="inline-flex items-center gap-1 rounded-chip bg-white/12 px-3 py-1.5">
                <StarIcon width={12} height={12} />
                {selectedServices.length
                  ? formatCurrency(grandTotal)
                  : locale === "vi"
                    ? "Menu giàu hình ảnh"
                    : "Image-led menu"}
              </span>
            </div>

            {spotlightServices.length > 0 ? (
              <div className="mt-4 grid grid-cols-[1.15fr,0.85fr] gap-3">
                <div className="group relative min-h-[212px] overflow-hidden rounded-[24px] border border-white/10">
                  <img
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    src={getServiceImage(spotlightServices[0])}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-900 via-brand-900/20 to-transparent" />
                  <div className="absolute inset-x-4 bottom-4">
                    <strong className="block font-heading text-lg font-bold line-clamp-2">
                      {localized(spotlightServices[0], "name", locale)}
                    </strong>
                    <p className="mt-1 text-xs text-white/75 line-clamp-2">
                      {localized(spotlightServices[0], "tagline", locale)}
                    </p>
                    <span className="mt-3 inline-flex rounded-chip bg-white/92 px-3 py-1.5 text-xs font-bold text-brand-900">
                      {formatCurrency(spotlightServices[0].price)}
                    </span>
                  </div>
                </div>

                <div className="grid gap-3">
                  {spotlightServices.slice(1).map((service) => (
                    <div
                      className="relative min-h-[100px] overflow-hidden rounded-card-lg border border-white/10"
                      key={service.id}
                    >
                      <img
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                        src={getServiceImage(service)}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-900/90 via-brand-900/20 to-transparent" />
                      <div className="absolute inset-x-3 bottom-3">
                        <strong className="block text-sm font-bold text-white line-clamp-2">
                          {localized(service, "name", locale)}
                        </strong>
                        <span className="mt-1 inline-flex rounded-chip bg-white/20 px-2 py-1 text-[11px] font-semibold text-white/85">
                          {localized(service, "badge", locale) || localized(service, "tagline", locale)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {/* Search */}
        <div className="relative z-10 -mt-4 flex items-center gap-3 px-4 py-3 rounded-card-lg bg-white shadow-card border border-surface-border">
          <SearchIcon width={20} height={20} className="text-gray-400 flex-shrink-0" />
          <input
            className="flex-1 min-w-0 bg-transparent outline-none text-sm text-brand-900 placeholder:text-gray-400"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={t("salon.search_placeholder")}
            type="search"
            value={searchTerm}
          />
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2 mt-3">
          <FilterChip
            label={locale === "vi" ? "Tất cả" : "All"}
            active={activeCategory === "all"}
            onClick={() => setActiveCategory("all")}
          />
          {data.categories.map((category) => (
            <FilterChip
              key={category.id}
              label={localized(category, "name", locale)}
              active={activeCategory === category.slug}
              onClick={() => setActiveCategory(category.slug)}
            />
          ))}
        </div>

        {/* Categories + services */}
        {visibleCategories.map((category) => {
          const services = filteredServices.filter((service) => service.categoryId === category.id);

          return (
            <section className="mt-5" key={category.id}>
              <SectionHeader
                title={localized(category, "name", locale)}
                action={
                  <span className="inline-flex rounded-chip bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-600">
                    {services.length}
                  </span>
                }
              />
              <p className="text-xs text-gray-400 -mt-2 mb-3">
                {localized(category, "teaser", locale)}
              </p>

              <div className="grid grid-cols-2 gap-3">
                {services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    onToggle={toggleService}
                    selected={selectedServiceIds.includes(service.id)}
                    service={service}
                    viewMode="grid"
                  />
                ))}
              </div>
            </section>
          );
        })}

        {filteredServices.length === 0 ? (
          <div className="mt-8 rounded-card-lg border border-dashed border-surface-border bg-white/80 px-5 py-8 text-center shadow-card">
            <p className="font-heading text-base font-bold text-brand-800">
              {t("services.no_results")}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {t("services.hero_subtitle")}
            </p>
          </div>
        ) : null}

        {/* Consultation checkbox */}
        <label className="flex items-start gap-3 mt-5 py-4 border-t border-b border-surface-border cursor-pointer">
          <input
            className="w-5 h-5 mt-0.5 accent-brand-700 rounded"
            checked={needsConsultation}
            onChange={toggleConsultation}
            type="checkbox"
          />
          <span>
            <strong className="block text-sm font-bold text-brand-700">
              {t("booking.consultation")}
            </strong>
          </span>
        </label>
      </main>

      {/* Sticky summary bar */}
      <StickySummaryBar
        count={selectedServices.length}
        subtotal={subtotal}
        taxAmount={taxAmount}
        tipAmount={tipAmount}
        total={grandTotal}
        ctaLabel={
          selectedServices.length || needsConsultation
            ? t("services.continue")
            : t("common.back")
        }
        ctaIcon={
          selectedServices.length || needsConsultation ? (
            <CheckIcon width={16} height={16} />
          ) : undefined
        }
        onCtaClick={() => navigate("/booking")}
      />
    </MobileShell>
  );
}
