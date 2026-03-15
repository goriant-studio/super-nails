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
  const response = await fetch("/api/bootstrap");
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
