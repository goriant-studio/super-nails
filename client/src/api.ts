import type { BookingConfirmation, BookingPayload, BootstrapData } from "./types";

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message =
      payload && typeof payload.message === "string"
        ? payload.message
        : "Yêu cầu không thành công.";

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function fetchBootstrapData(): Promise<BootstrapData> {
  // Try live API first, fallback to static JSON (GitHub Pages)
  try {
    const response = await fetch("/api/bootstrap");
    if (response.ok) {
      return response.json() as Promise<BootstrapData>;
    }
  } catch {
    // API not available, use static data
  }

  const base = import.meta.env.BASE_URL;
  const response = await fetch(`${base}api/bootstrap.json`);
  return parseJson<BootstrapData>(response);
}

export async function submitBookingRequest(
  payload: BookingPayload
): Promise<BookingConfirmation> {
  const response = await fetch("/api/bookings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await parseJson<{ ok: boolean; booking: BookingConfirmation }>(response);
  return data.booking;
}
