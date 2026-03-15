import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useBooking } from "../booking-context";
import { AppHeader } from "../components/AppHeader";
import { FilterChip } from "../components/FilterChip";
import { MobileShell } from "../components/MobileShell";
import { ServiceCard } from "../components/service-card";
import { StickySummaryBar } from "../components/StickySummaryBar";
import { CheckIcon, GridIcon, SearchIcon } from "../components/icons";
import { SectionHeader } from "../components/SectionHeader";

export function ServicesPage() {
  const navigate = useNavigate();
  const {
    data,
    selectedServiceIds,
    selectedServices,
    selectedTotal,
    needsConsultation,
    toggleService,
    toggleConsultation,
  } = useBooking();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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
      <AppHeader
        title="Chọn dịch vụ"
        actions={
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1.5 px-3 py-2 rounded-button bg-white text-brand-700 text-xs font-semibold border border-brand-200 active:scale-95 transition-all"
              onClick={() =>
                setViewMode((c) => (c === "grid" ? "list" : "grid"))
              }
              type="button"
            >
              <GridIcon width={14} height={14} />
              Kiểu xem
            </button>
            <span className="w-9 h-9 flex items-center justify-center rounded-button bg-white text-red-600 text-xs font-bold border border-gray-200 shadow-card">
              VN
            </span>
          </div>
        }
      />

      <main className="px-4 py-4 pb-36">
        {/* Search */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-card-lg bg-white shadow-card border border-surface-border">
          <SearchIcon width={20} height={20} className="text-gray-400 flex-shrink-0" />
          <input
            className="flex-1 min-w-0 bg-transparent outline-none text-sm text-brand-900 placeholder:text-gray-400"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm kiếm dịch vụ, nhóm dịch vụ"
            type="search"
            value={searchTerm}
          />
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2 mt-3">
          <FilterChip
            label="Tất cả"
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

              <div
                className={`grid gap-3 ${
                  viewMode === "grid"
                    ? "grid-cols-2"
                    : "grid-cols-1"
                }`}
              >
                {services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    onToggle={toggleService}
                    selected={selectedServiceIds.includes(service.id)}
                    service={service}
                    viewMode={viewMode}
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
              Anh không biết chọn dịch vụ gì?
            </strong>
            <small className="block text-xs text-gray-400 mt-1">
              Nhân viên sẽ giúp anh chọn dịch vụ phù hợp tại cửa hàng.
            </small>
          </span>
        </label>

        {/* Offers */}
        <div className="flex items-center justify-between gap-3 mt-4 text-brand-700">
          <span className="text-sm font-bold">Ưu đãi của anh</span>
          <button
            className="px-3 py-1.5 rounded-button bg-white text-brand-700 text-xs font-semibold border border-brand-200"
            type="button"
          >
            Chọn ưu đãi
          </button>
        </div>
      </main>

      {/* Sticky summary bar */}
      <StickySummaryBar
        count={selectedServices.length}
        total={selectedTotal}
        ctaLabel={
          selectedServices.length || needsConsultation ? "Xong" : "Quay lại"
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
