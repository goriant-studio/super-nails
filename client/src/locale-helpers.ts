/**
 * Pick the locale-appropriate field from an entity.
 *
 * Given an item with fields like `name`, `nameEn`, `nameVi`,
 * returns the value for the current locale with fallback to the base field.
 *
 * @example
 * localized(service, "name", "vi")  // → service.nameVi || service.name
 * localized(service, "badge", "en") // → service.badgeEn ?? service.badge
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function localized(item: any, field: string, locale: "en" | "vi"): string {
  const suffix = locale === "en" ? "En" : "Vi";
  const localizedKey = `${field}${suffix}`;
  const val = item[localizedKey];
  if (typeof val === "string" && val.length > 0) return val;
  const base = item[field];
  return typeof base === "string" ? base : "";
}
