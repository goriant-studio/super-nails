import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useBooking } from "../booking-context";
import { AppHeader } from "../components/AppHeader";
import { FilterChip } from "../components/FilterChip";
import { MobileShell } from "../components/MobileShell";
import { SalonCard } from "../components/salon-card";
import {
  BookmarkIcon,
  CarIcon,
  ChevronRightIcon,
  MapPinIcon,
  SearchIcon,
  StarIcon,
} from "../components/icons";

export function SalonPage() {
  const { data, selectedSalon, chooseSalon } = useBooking();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [parkingOnly, setParkingOnly] = useState(false);
  const [premiumOnly, setPremiumOnly] = useState(false);

  const filteredSalons = useMemo(() => {
    return data.salons.filter((salon) => {
      const matchesSearch =
        !searchTerm ||
        `${salon.name} ${salon.street} ${salon.district} ${salon.provinceName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesProvince =
        !selectedProvince || salon.provinceName === selectedProvince;
      const matchesNearby = !nearbyOnly || salon.nearby;
      const matchesParking = !parkingOnly || salon.parking;
      const matchesPremium = !premiumOnly || salon.premium;

      return (
        matchesSearch &&
        matchesProvince &&
        matchesNearby &&
        matchesParking &&
        matchesPremium
      );
    });
  }, [
    data.salons,
    nearbyOnly,
    parkingOnly,
    premiumOnly,
    searchTerm,
    selectedProvince,
  ]);

  function handleSelectSalon(salonId: number) {
    chooseSalon(salonId);
    navigate("/booking");
  }

  return (
    <MobileShell>
      <AppHeader title="Chọn salon" />

      <main className="px-4 py-4 pb-8">
        {/* Search box */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-card-lg bg-white shadow-card border border-surface-border">
          <SearchIcon width={20} height={20} className="text-gray-400 flex-shrink-0" />
          <input
            className="flex-1 min-w-0 bg-transparent outline-none text-sm text-brand-900 placeholder:text-gray-400"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm kiếm salon theo tỉnh, thành phố, quận"
            type="search"
            value={searchTerm}
          />
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
          <FilterChip
            label="Gần bạn"
            active={nearbyOnly}
            icon={<MapPinIcon width={16} height={16} />}
            onClick={() => setNearbyOnly((v) => !v)}
          />
          <FilterChip
            label="Có chỗ đậu ô tô"
            active={parkingOnly}
            icon={<CarIcon width={16} height={16} />}
            onClick={() => setParkingOnly((v) => !v)}
          />
          <FilterChip
            label="Premium"
            active={premiumOnly}
            icon={<StarIcon width={16} height={16} />}
            onClick={() => setPremiumOnly((v) => !v)}
          />
        </div>

        {/* Saved salon */}
        <div className="flex items-center gap-3 p-3.5 mt-4 rounded-card bg-white border border-surface-border shadow-card">
          <span className="w-10 h-10 flex items-center justify-center rounded-card bg-brand-50 text-brand-700">
            <BookmarkIcon width={18} height={18} />
          </span>
          <div className="flex-1 min-w-0">
            <strong className="block text-sm font-bold text-brand-900">
              Địa điểm đã lưu
            </strong>
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
              {selectedSalon
                ? `Đang ưu tiên ${selectedSalon.shortAddress}`
                : "Đến chi nhánh yêu thích của anh dễ dàng hơn"}
            </p>
          </div>
          <ChevronRightIcon
            width={16}
            height={16}
            className="text-gray-300 flex-shrink-0"
          />
        </div>

        {/* Province filter */}
        <section className="mt-5">
          <h2 className="font-heading text-base font-bold text-brand-700 mb-3">
            Super Nails có mặt tại các tỉnh thành
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-3.5 py-2 rounded-chip text-sm font-semibold transition-all active:scale-95 ${
                selectedProvince === null
                  ? "bg-brand-700 text-white shadow-button"
                  : "bg-white text-gray-600 border border-gray-200"
              }`}
              onClick={() => setSelectedProvince(null)}
              type="button"
            >
              Tất cả
            </button>
            {data.provinces.map((province) => (
              <button
                key={province.id}
                className={`px-3.5 py-2 rounded-chip text-sm font-semibold transition-all active:scale-95 ${
                  selectedProvince === province.name
                    ? "bg-brand-700 text-white shadow-button"
                    : "bg-white text-gray-600 border border-gray-200"
                }`}
                onClick={() =>
                  setSelectedProvince((current) =>
                    current === province.name ? null : province.name
                  )
                }
                type="button"
              >
                {province.name}
              </button>
            ))}
          </div>
        </section>

        {/* Salon results */}
        <div className="space-y-4 mt-5">
          {filteredSalons.map((salon) => (
            <SalonCard
              key={salon.id}
              onSelect={handleSelectSalon}
              salon={salon}
              selected={selectedSalon?.id === salon.id}
            />
          ))}
          {filteredSalons.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">
              Không tìm thấy salon phù hợp. Thử bỏ bớt bộ lọc.
            </p>
          )}
        </div>
      </main>
    </MobileShell>
  );
}
