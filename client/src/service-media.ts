import type { Service } from "./types";

const DEFAULT_SERVICE_IMAGE = "/images/services/luxury-01-shine-combo-1.webp";

const SERVICE_IMAGE_MAP: Record<number, string> = {
  1: "/images/services/luxury-01-shine-combo-1.webp",
  2: "/images/services/luxury-02-shine-combo-2.webp",
  3: "/images/services/luxury-03-shine-combo-3.webp",
  4: "/images/services/luxury-04-express-trim.webp",
  5: "/images/services/luxury-05-soft-french-tips.webp",
  6: "/images/services/luxury-06-cat-eye-galaxy.webp",
  7: "/images/services/luxury-07-bridal-crystal-set.webp",
  8: "/images/services/luxury-08-pedicure-refresh.webp",
  9: "/images/services/luxury-09-luxury-spa-pedicure.webp",
  10: "/images/services/luxury-10-hand-recovery-ritual.webp",
  11: "/images/services/luxury-11-velvet-jelly-tint.webp",
  12: "/images/services/luxury-12-bare-satin-manicure.webp",
  13: "/images/services/luxury-13-chrome-mirror-set.webp",
  14: "/images/services/luxury-14-aura-airbrush-blend.webp",
  15: "/images/services/luxury-15-detox-pedicure-therapy.webp",
  16: "/images/services/luxury-16-collagen-hand-foot-ritual.webp",
};

export function getServiceImage(service: Service): string {
  return service.image || SERVICE_IMAGE_MAP[service.id] || DEFAULT_SERVICE_IMAGE;
}

export function pickServices(
  services: Service[],
  preferredIds: number[],
  count: number
): Service[] {
  const picked: Service[] = [];

  preferredIds.forEach((id) => {
    const match = services.find((service) => service.id === id);
    if (match && !picked.some((service) => service.id === match.id)) {
      picked.push(match);
    }
  });

  services.forEach((service) => {
    if (picked.length >= count) return;
    if (!picked.some((item) => item.id === service.id)) {
      picked.push(service);
    }
  });

  return picked.slice(0, count);
}
