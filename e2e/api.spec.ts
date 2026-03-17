/**
 * API E2E tests.
 *
 * By default these target the local Express server on 127.0.0.1:3001 so local
 * development stays self-contained. Set `API_BASE_URL` (or legacy `WORKER_URL`)
 * to point the same assertions at a hosted API or worker environment.
 */
import { test, expect } from "@playwright/test";

const API_BASE_URL =
  process.env.API_BASE_URL ??
  process.env.WORKER_URL ??
  "http://127.0.0.1:3001";

// Today's date in YYYY-MM-DD (Vietnam time, UTC+7)
function todayVN(): string {
  const now = new Date(Date.now() + 7 * 3600 * 1000);
  return now.toISOString().slice(0, 10);
}

test.describe("API — /api/health", () => {
  test("returns ok:true", async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.service).toBe("super-nails-api");
    expect(typeof body.ts).toBe("number");
  });
});

test.describe("API — /api/static", () => {
  test("returns salons, services, stylists, categories, provinces", async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/static`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.salons)).toBe(true);
    expect(body.salons.length).toBeGreaterThan(0);
    expect(Array.isArray(body.services)).toBe(true);
    expect(body.services.length).toBeGreaterThan(0);
    expect(Array.isArray(body.stylists)).toBe(true);
    expect(Array.isArray(body.categories)).toBe(true);
    expect(Array.isArray(body.provinces)).toBe(true);
  });

  test("salon objects have required fields", async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/static`);
    const body = await res.json();
    const salon = body.salons[0];
    expect(salon).toHaveProperty("id");
    expect(salon).toHaveProperty("name");
    expect(salon).toHaveProperty("district");
    expect(salon).toHaveProperty("city");
  });

  test("service objects have price field", async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/static`);
    const body = await res.json();
    const svc = body.services[0];
    expect(svc).toHaveProperty("price");
    expect(typeof svc.price).toBe("number");
    expect(svc.price).toBeGreaterThan(0);
  });
});

test.describe("API — /api/slots", () => {
  test("returns array of slots for salonId=1 and today's date", async ({ request }) => {
    const date = todayVN();
    const res = await request.get(`${API_BASE_URL}/api/slots?salonId=1&date=${date}`);
    expect(res.status()).toBe(200);
    const slots: unknown[] = await res.json();
    expect(Array.isArray(slots)).toBe(true);
    expect(slots.length).toBeGreaterThan(0);
  });

  test("slot objects have required fields", async ({ request }) => {
    const date = todayVN();
    const res = await request.get(`${API_BASE_URL}/api/slots?salonId=1&date=${date}`);
    const slots: Record<string, unknown>[] = await res.json();
    const slot = slots[0];
    expect(slot).toHaveProperty("salonId");
    expect(slot).toHaveProperty("date");
    expect(slot).toHaveProperty("time");
    expect(slot).toHaveProperty("isPeak");
    expect(slot).toHaveProperty("isAvailable");
  });

  test("returns 400 when salonId is missing", async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/slots?date=${todayVN()}`);
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  test("returns 400 when date format is invalid", async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/slots?salonId=1&date=not-a-date`);
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });
});

test.describe("API — /api/bookings POST", () => {
  test("valid payload returns 201 with confirmationCode", async ({ request }) => {
    const date = todayVN();

    // Fetch an available slot dynamically so the suite stays stable across reruns.
    const slotsRes = await request.get(`${API_BASE_URL}/api/slots?salonId=1&date=${date}`);
    const slots = await slotsRes.json();
    const available = slots.find((s: { isAvailable: boolean }) => s.isAvailable);
    test.skip(!available, "No available slots left for today — cannot test booking");

    const res = await request.post(`${API_BASE_URL}/api/bookings`, {
      data: {
        salonId: 1,
        stylistId: 1,
        appointmentDate: date,
        appointmentTime: available!.time,
        serviceIds: [1],
        needsConsultation: false,
        customerName: "E2E Test User",
        paymentMethod: "cash",
        tipAmount: 0,
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.booking).toHaveProperty("confirmationCode");
    expect(body.booking.confirmationCode).toMatch(/^SN-/);
  });

  test("returns 400 when required fields are missing", async ({ request }) => {
    const res = await request.post(`${API_BASE_URL}/api/bookings`, {
      data: {
        // Missing salonId, stylistId, etc.
        serviceIds: [1],
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  test("returns 400 when no services and no consultation", async ({ request }) => {
    const date = todayVN();
    const res = await request.post(`${API_BASE_URL}/api/bookings`, {
      data: {
        salonId: 1,
        stylistId: 1,
        appointmentDate: date,
        appointmentTime: "14:00",
        serviceIds: [],
        needsConsultation: false,
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  test("invalid JSON body returns 400", async ({ request }) => {
    const res = await request.post(`${API_BASE_URL}/api/bookings`, {
      headers: { "Content-Type": "application/json" },
      data: "not valid json {{{",
    });
    expect(res.status()).toBe(400);
  });
});

test.describe("API — unknown routes", () => {
  test("returns 404 for unknown path", async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/unknown-route`);
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });
});
