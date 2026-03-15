export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDistance(distanceKm: number) {
  return `${distanceKm.toFixed(1)} km`;
}

export function formatDuration(minutes: number) {
  return `${minutes} phút`;
}

function getVietnameseWeekday(day: number) {
  const weekdays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  return weekdays[day];
}

function formatLocalDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function formatDateLabel(isoDate: string, referenceDate: string) {
  const date = new Date(`${isoDate}T00:00:00`);
  const today = new Date(`${referenceDate}T00:00:00`);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const base = `${getVietnameseWeekday(date.getDay())} (${String(
    date.getDate()
  ).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")})`;

  if (isoDate === referenceDate) {
    return `Hôm nay, ${base}`;
  }

  if (isoDate === formatLocalDateKey(tomorrow)) {
    return `Ngày mai, ${base}`;
  }

  return base;
}

export function formatDatePill(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00`);
  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

export function getWeekendLabel(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.getDay() === 0 || date.getDay() === 6 ? "Cuối tuần" : "Trong tuần";
}

export function isWeekend(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.getDay() === 0 || date.getDay() === 6;
}

export function formatAvailabilityHint(availableCount: number) {
  if (availableCount >= 12) {
    return "Ngày mai còn nhiều khung giờ trống. Chọn sớm để có stylist đẹp nhất.";
  }

  if (availableCount >= 6) {
    return `Ngày mai còn ${availableCount} khung giờ đẹp. Bấm vào ngày mai nếu anh muốn dễ hơn.`;
  }

  return "Anh không có giờ phù hợp? Chọn stylist khác hoặc đổi sang ngày mai.";
}

export function toneClassName(tone: string) {
  return `tone-${tone}`;
}
