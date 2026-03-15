import type { BookingConfirmation, BookingPayload, BootstrapData, TimeSlot } from "./types";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

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

/** Fetch static data (salons, stylists, categories, services, provinces).
 *  Tries the live API first, falls back to the bundled bootstrap.json. */
export async function fetchStaticData(): Promise<Omit<BootstrapData, "timeSlots">> {
  try {
    const response = await fetch(`${API_BASE}/api/static`);
    if (response.ok) {
      return response.json() as Promise<Omit<BootstrapData, "timeSlots">>;
    }
  } catch {
    // API not available, fall through to static file
  }

  // Fallback: bundled static JSON (works on GitHub Pages without a live API)
  const base = import.meta.env.BASE_URL;
  const response = await fetch(`${base}api/bootstrap.json`);
  return parseJson<BootstrapData>(response);
}

/** Fetch time slots for a specific salon and date (YYYY-MM-DD). */
export async function fetchSlots(salonId: number, date: string): Promise<TimeSlot[]> {
  try {
    const response = await fetch(`${API_BASE}/api/slots?salonId=${salonId}&date=${date}`);
    if (response.ok) {
      return response.json() as Promise<TimeSlot[]>;
    }
  } catch {
    // Fallback: return empty array so UI can show "no slots"
  }
  return [];
}

/** @deprecated Use fetchStaticData() + fetchSlots() instead.
 *  Kept for backwards compatibility with bootstrap.json fallback path. */
export async function fetchBootstrapData(): Promise<BootstrapData> {
  const staticData = await fetchStaticData();
  return {
    ...staticData,
    // timeSlots will be populated lazily via fetchSlots()
    timeSlots: [],
  };
}

export async function submitBookingRequest(
  payload: BookingPayload
): Promise<BookingConfirmation> {
  const response = await fetch(`${API_BASE}/api/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await parseJson<{ ok: boolean; booking: BookingConfirmation }>(response);
  return data.booking;
}
