/**
 * Format a price in USD cents to display string.
 * e.g. 3000 → "$30.00"
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatDistance(distanceKm: number) {
  return `${distanceKm.toFixed(1)} km`;
}

export function formatDuration(minutes: number, locale: "en" | "vi" = "en") {
  return locale === "vi" ? `${minutes} phút` : `${minutes} min`;
}

function getWeekday(day: number, locale: "en" | "vi") {
  const weekdaysVi = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const weekdaysEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return locale === "vi" ? weekdaysVi[day] : weekdaysEn[day];
}

function formatLocalDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function formatDateLabel(
  isoDate: string,
  referenceDate: string,
  locale: "en" | "vi" = "en"
) {
  const date = new Date(`${isoDate}T00:00:00`);
  const today = new Date(`${referenceDate}T00:00:00`);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const base = `${getWeekday(date.getDay(), locale)} (${String(
    date.getDate()
  ).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")})`;

  if (isoDate === referenceDate) {
    return locale === "vi" ? `Hôm nay, ${base}` : `Today, ${base}`;
  }

  if (isoDate === formatLocalDateKey(tomorrow)) {
    return locale === "vi" ? `Ngày mai, ${base}` : `Tomorrow, ${base}`;
  }

  return base;
}

export function formatDatePill(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00`);
  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

export function getWeekendLabel(isoDate: string, locale: "en" | "vi" = "en") {
  const date = new Date(`${isoDate}T00:00:00`);
  if (date.getDay() === 0 || date.getDay() === 6) {
    return locale === "vi" ? "Cuối tuần" : "Weekend";
  }
  return locale === "vi" ? "Trong tuần" : "Weekday";
}

export function isWeekend(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.getDay() === 0 || date.getDay() === 6;
}

export function formatAvailabilityHint(
  availableCount: number,
  locale: "en" | "vi" = "en"
) {
  if (locale === "vi") {
    if (availableCount >= 12)
      return "Ngày mai còn nhiều khung giờ trống. Chọn sớm để có stylist đẹp nhất.";
    if (availableCount >= 6)
      return `Ngày mai còn ${availableCount} khung giờ đẹp.`;
    return "Không có giờ phù hợp? Chọn stylist khác hoặc đổi sang ngày mai.";
  }
  if (availableCount >= 12) return "Many time slots available. Book early for the best stylist.";
  if (availableCount >= 6)
    return `${availableCount} great time slots available.`;
  return "No matching times? Try another stylist or a different day.";
}

export function toneClassName(tone: string) {
  return `tone-${tone}`;
}
