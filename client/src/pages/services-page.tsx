import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useBooking } from "../booking-context";
import { AppHeader } from "../components/AppHeader";
import { FilterChip } from "../components/FilterChip";
import { MobileShell } from "../components/MobileShell";
import { ServiceCard } from "../components/service-card";
import { StickySummaryBar } from "../components/StickySummaryBar";
import { CheckIcon, SearchIcon } from "../components/icons";
import { SectionHeader } from "../components/SectionHeader";
import { useT, useLocale } from "../i18n/i18n-context";

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

  const visibleCategories = useMemo(() => {
    return data.categories.filter((category) => {
      if (activeCategory !== "all" && activeCategory !== category.slug) {
        return false;
      }

      return data.services.some((service) => {
        const matchesCategory = service.categoryId === category.id;
        const matchesSearch =
          !searchTerm ||
          `${service.name} ${service.description} ${service.tagline}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase());

        return matchesCategory && matchesSearch;
      });
    });
  }, [activeCategory, data.categories, data.services, searchTerm]);

  return (
    <MobileShell>
      <AppHeader title={t("services.title")} />

      <main className="px-4 py-4 pb-40">
        {/* Search */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-card-lg bg-white shadow-card border border-surface-border">
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
              label={category.name}
              active={activeCategory === category.slug}
              onClick={() => setActiveCategory(category.slug)}
            />
          ))}
        </div>

        {/* Categories + services */}
        {visibleCategories.map((category) => {
          const services = data.services.filter((service) => {
            const matchesCategory = service.categoryId === category.id;
            const matchesSearch =
              !searchTerm ||
              `${service.name} ${service.description} ${service.tagline}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase());

            return matchesCategory && matchesSearch;
          });

          return (
            <section className="mt-5" key={category.id}>
              <SectionHeader title={category.name} />
              <p className="text-xs text-gray-400 -mt-2 mb-3">
                {category.teaser}
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
