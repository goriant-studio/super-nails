import type { Service } from "./types";

const DEFAULT_SERVICE_IMAGE = "/images/services/gloss.svg";

const SERVICE_IMAGE_MAP: Record<number, string> = {
  1: "/images/services/gloss.svg",
  2: "/images/services/jelly.svg",
  3: "/images/services/ritual.svg",
  4: "/images/services/minimal.svg",
  5: "/images/services/minimal.svg",
  6: "/images/services/chrome.svg",
  7: "/images/services/bridal.svg",
  8: "/images/services/pedicure.svg",
  9: "/images/services/pedicure-luxe.svg",
  10: "/images/services/ritual.svg",
  11: "/images/services/jelly.svg",
  12: "/images/services/minimal.svg",
  13: "/images/services/chrome.svg",
  14: "/images/services/aura.svg",
  15: "/images/services/pedicure-luxe.svg",
  16: "/images/services/ritual.svg",
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
