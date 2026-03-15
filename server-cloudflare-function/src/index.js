// Super Nails API — Cloudflare Worker
// Routes: /api/health, /api/static, /api/slots, /api/bookings

const STDB_BASE = "https://maincloud.spacetimedb.com";
const STDB_MODULE = "super_nails"; // underscore — dashes not allowed in STDB module names

const ALLOWED_ORIGINS = [
  "https://goriant-studio.github.io",
  "https://super-nails.goriant.com",
  "http://localhost:5173",
  "http://localhost:4173",
];

// ─── Embedded static data fallback (mirrors server/src/db.js seed data) ───────
const STATIC_DATA = {
  generatedAt: new Date(0).toISOString(),
  provinces: [
    { id: 1, name: "TP Ho Chi Minh", region: "Mien Nam" },
    { id: 3, name: "Da Nang", region: "Mien Trung" },
  ],
  salons: [
    { id: 1, provinceId: 1, provinceName: "TP Ho Chi Minh", name: "Super Nails - Riverside Q7", district: "Quan 7", city: "TP Ho Chi Minh", street: "420 Huynh Tan Phat, P. Binh Thuan", shortAddress: "420 Huynh Tan Phat, Q7", note: "Gan cau Phu My, co bai do oto va phong nail signature view song.", travelMinutes: 12, distanceKm: 5.5, nearby: true, parking: true, premium: false, heroTone: "cobalt", gallery: ["Midnight gloss", "Blue facade", "Spa lounge"] },
    { id: 2, provinceId: 1, provinceName: "TP Ho Chi Minh", name: "Super Nails - Nguyen Thi Thap", district: "Quan 7", city: "TP Ho Chi Minh", street: "237 Nguyen Thi Thap, P. Tan Phu", shortAddress: "237 Nguyen Thi Thap, Q7", note: "Khong gian sang va nhanh, phu hop booking sau gio lam.", travelMinutes: 14, distanceKm: 7.1, nearby: true, parking: false, premium: true, heroTone: "sunrise", gallery: ["Gold bar", "Express care", "Glass storefront"] },
    { id: 3, provinceId: 1, provinceName: "TP Ho Chi Minh", name: "Super Nails - Crescent Premium", district: "Quan 7", city: "TP Ho Chi Minh", street: "408 Nguyen Thi Thap, P. Tan Quy", shortAddress: "408 Nguyen Thi Thap, Q7", note: "Premium lounge, menu cham soc chuyen sau va bai do xe rong.", travelMinutes: 16, distanceKm: 7.5, nearby: true, parking: true, premium: true, heroTone: "emerald", gallery: ["Emerald lounge", "Private suite", "Art wall"] },
    { id: 4, provinceId: 1, provinceName: "TP Ho Chi Minh", name: "Super Nails - Tran Nao", district: "Quan 2", city: "TP Ho Chi Minh", street: "103 Tran Nao, P. Binh An", shortAddress: "103 Tran Nao, Quan 2", note: "Chi nhanh gan trung tam moi, phu hop combo cham soc da va nail art.", travelMinutes: 18, distanceKm: 9.1, nearby: false, parking: true, premium: true, heroTone: "violet", gallery: ["Sky blue", "Signature room", "Soft glow"] },
    { id: 5, provinceId: 1, provinceName: "TP Ho Chi Minh", name: "Super Nails - Ton Dan", district: "Quan 4", city: "TP Ho Chi Minh", street: "25 Ton Dan, P. 13", shortAddress: "25 Ton Dan, Quan 4", note: "Diem hen nhanh cho khach yeu thich caticle clean va gel box.", travelMinutes: 20, distanceKm: 9.7, nearby: false, parking: false, premium: true, heroTone: "rose", gallery: ["Rose studio", "Glass shelves", "Velvet seats"] },
    { id: 6, provinceId: 3, provinceName: "Da Nang", name: "Super Nails - Hai Chau", district: "Hai Chau", city: "Da Nang", street: "88 Bach Dang, Hai Chau", shortAddress: "88 Bach Dang, Da Nang", note: "Phong cach resort, phu hop khach du lich muon booking nhanh bang PWA.", travelMinutes: 11, distanceKm: 4.2, nearby: true, parking: true, premium: true, heroTone: "sand", gallery: ["Beach light", "Clean station", "River view"] },
  ],
  stylists: [
    { id: 1, salonId: 1, name: "Linh", title: "Master Nail Artist", specialty: "Gel ombre va charm stone", accent: "cobalt" },
    { id: 2, salonId: 1, name: "An", title: "Senior Stylist", specialty: "Pedicure spa va French tips", accent: "sunrise" },
    { id: 3, salonId: 1, name: "Vy", title: "Signature Artist", specialty: "Minimal chrome va cat eye", accent: "violet" },
    { id: 4, salonId: 2, name: "Hanh", title: "Senior Stylist", specialty: "Combo nhanh sau gio lam", accent: "emerald" },
    { id: 5, salonId: 2, name: "My", title: "Color Specialist", specialty: "Nhuom nail jelly va seasonal palette", accent: "rose" },
    { id: 6, salonId: 3, name: "Nhi", title: "Premium Artist", specialty: "Builder gel va bridal set", accent: "gold" },
    { id: 7, salonId: 3, name: "Tram", title: "Spa Lead", specialty: "Cham soc da tay chan chuyen sau", accent: "emerald" },
    { id: 8, salonId: 4, name: "Thu", title: "Creative Lead", specialty: "Airbrush va line art", accent: "violet" },
    { id: 9, salonId: 4, name: "Bao", title: "Spa Stylist", specialty: "Head spa va cham soc cuticle", accent: "sand" },
    { id: 10, salonId: 5, name: "Khanh", title: "Signature Artist", specialty: "Box short set va nude collection", accent: "rose" },
    { id: 11, salonId: 6, name: "Ha", title: "Resort Stylist", specialty: "Recovery spa va premium polish", accent: "sand" },
  ],
  categories: [
    { id: 1, slug: "combo-moi", name: "Combo moi va hot", teaser: "Nhung goi dang duoc dat nhieu trong tuan" },
    { id: 2, slug: "nail-co-ban", name: "Nail co ban", teaser: "Cat da, son gel va design nhe cho lich hen nhanh" },
    { id: 3, slug: "nail-art", name: "Nail art va premium", teaser: "Builder gel, charm da va bo suu tap dep sang" },
    { id: 4, slug: "pedicure", name: "Pedicure va cham soc", teaser: "Lam sach, massage va duong am chan" },
    { id: 5, slug: "spa", name: "Spa thu gian", teaser: "Massage tay chan va phuc hoi da" },
  ],
  services: [
    { id: 1, categoryId: 1, name: "Shine Combo 1", description: "Cat da, son gel mot mau va massage tay 10 phut.", durationMinutes: 45, price: 122000, badge: "Dong gia cuoi tuan", accent: "cobalt", tagline: "Nhanh, gon va de dat lich" },
    { id: 2, categoryId: 1, name: "Shine Combo 2", description: "Cat da, son gel, cham soc cuticle va dap mat na tay.", durationMinutes: 60, price: 205000, badge: "Moi", accent: "violet", tagline: "Combo de chot lich nhieu nhat" },
    { id: 3, categoryId: 1, name: "Shine Combo 3", description: "Builder gel tu nhien, massage co vai va phu kien nhe.", durationMinutes: 75, price: 309000, badge: "Premium", accent: "emerald", tagline: "Di kem thu gian co vai gay" },
    { id: 4, categoryId: 2, name: "Cat xa express", description: "Cat da nhanh, duong mong va son duong bong.", durationMinutes: 30, price: 97000, badge: null, accent: "sunrise", tagline: "Phu hop lich hen 30 phut" },
    { id: 5, categoryId: 2, name: "French tip soft", description: "Nen gel trong va ve French tip tay cong mem.", durationMinutes: 40, price: 149000, badge: null, accent: "cobalt", tagline: "Classic nhung van rat sang" },
    { id: 6, categoryId: 3, name: "Cat eye galaxy", description: "Son gel cat eye nhieu lop va hieu ung anh kim.", durationMinutes: 55, price: 229000, badge: "Hot trend", accent: "violet", tagline: "Len anh dep tren iPhone" },
    { id: 7, categoryId: 3, name: "Bridal crystal set", description: "Bo nail cuoi voi charm da, line art va builder gel.", durationMinutes: 90, price: 429000, badge: "Premium", accent: "gold", tagline: "Danh cho ngay dac biet" },
    { id: 8, categoryId: 4, name: "Pedicure refresh", description: "Lam sach goc chan, tay da chet va son gel chan.", durationMinutes: 50, price: 189000, badge: null, accent: "emerald", tagline: "Chan nhe va sach se hon" },
    { id: 9, categoryId: 4, name: "Luxury spa pedicure", description: "Pedicure co massage da nong, muoi ngam va serum phuc hoi.", durationMinutes: 65, price: 259000, badge: "Thu gian", accent: "sand", tagline: "Rat hop cho cuoi tuan" },
    { id: 10, categoryId: 5, name: "Hand recovery ritual", description: "Tay te bao chet, massage, serum va paraffin mem da.", durationMinutes: 35, price: 164000, badge: null, accent: "rose", tagline: "Duong am va phuc hoi nhanh" },
  ],
};

// 32 time slots (mirrors server/src/db.js exactly)
const TIMES = [
  "10:00","10:20","10:40","11:00","11:20","11:40",
  "12:00",
  "13:00","13:20","13:40","14:00","14:20",
  "15:00","15:20","15:40","16:00","16:20","16:40",
  "17:00","17:20","17:40",
  "18:00","18:20","18:40",
  "19:00","19:20","19:40",
  "20:00","20:20","20:40",
  "21:00","21:20",
];

// ─── CORS helpers ───────────────────────────────────────────────────────────

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function jsonResponse(data, status = 200, origin = "") {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(origin),
    },
  });
}

function errorResponse(message, status = 400, origin = "") {
  return jsonResponse({ ok: false, message }, status, origin);
}

// ─── SpacetimeDB helpers ────────────────────────────────────────────────────

async function stdbSql(env, query) {
  const resp = await fetch(
    `${STDB_BASE}/v1/database/${STDB_MODULE}/sql`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.SPACETIMEDB_TOKEN}`,
      },
      body: JSON.stringify({ query }),
    }
  );
  if (!resp.ok) throw new Error(`STDB SQL error ${resp.status}: ${await resp.text()}`);
  return resp.json();
}

async function stdbReduce(env, reducer, args) {
  const resp = await fetch(
    `${STDB_BASE}/v1/database/${STDB_MODULE}/call/${reducer}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.SPACETIMEDB_TOKEN}`,
      },
      body: JSON.stringify(args),
    }
  );
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || `STDB reducer error ${resp.status}`);
  }
  return resp.json();
}

// ─── Slot generation (JS fallback, mirrors db.js busy pattern) ─────────────

function generateSlotsForSalonAndDate(salonId, dateStr, dayOffset) {
  const date = new Date(dateStr + "T00:00:00+07:00");
  const weekday = date.getDay(); // 0=Sun, 6=Sat
  const weekend = weekday === 0 || weekday === 6;

  return TIMES.map((time, slotIndex) => {
    const hour = parseInt(time.split(":")[0], 10);
    const isPeak = weekend || hour >= 18;
    const busyPattern = ((salonId * 11) + (dayOffset * 5) + slotIndex) % 9;
    const isAvailable = busyPattern === 0 && hour >= 21 ? false : busyPattern > 1;
    return { id: salonId * 10000 + dayOffset * 100 + slotIndex, salonId, date: dateStr, time, isPeak, isAvailable };
  });
}

function getDateStr(offsetDays, nowMs) {
  // Returns VN local date string "YYYY-MM-DD"
  const vn = new Date(nowMs + 7 * 3600 * 1000);
  vn.setUTCDate(vn.getUTCDate() + offsetDays);
  return vn.toISOString().slice(0, 10);
}

// ─── Route handlers ─────────────────────────────────────────────────────────

async function handleHealth(origin) {
  return jsonResponse({ ok: true, service: "super-nails-api", ts: Date.now() }, 200, origin);
}

async function handleStatic(request, env, ctx, origin) {
  const cache = caches.default;
  // Use a fixed static cache key (Issue 7 fix: don't inherit request params)
  const cacheKey = new Request("https://cache.internal/api/static");

  let cached = await cache.match(cacheKey);
  if (cached) {
    // Re-apply CORS headers for this request's origin
    const body = await cached.text();
    return new Response(body, {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(origin), "X-Cache": "HIT" },
    });
  }

  let data;
  if (env.SPACETIMEDB_TOKEN) {
    try {
      const rows = await stdbSql(env, `
        SELECT s.id, s.province_id, p.name AS province_name, s.name, s.district, s.city,
               s.street, s.short_address, s.note, s.travel_minutes, s.distance_km,
               s.nearby, s.parking, s.premium, s.hero_tone, s.gallery_json
        FROM salons s JOIN provinces p ON p.id = s.province_id
        ORDER BY s.nearby DESC, s.premium DESC, s.distance_km ASC
      `);
      const salonsRaw = rows[0]?.rows ?? [];
      const salons = salonsRaw.map(r => ({
        id: r[0], provinceId: r[1], provinceName: r[2], name: r[3], district: r[4],
        city: r[5], street: r[6], shortAddress: r[7], note: r[8], travelMinutes: r[9],
        distanceKm: r[10], nearby: r[11], parking: r[12], premium: r[13], heroTone: r[14],
        gallery: JSON.parse(r[15] ?? "[]"),
      }));

      const stylistRows = (await stdbSql(env, "SELECT id, salon_id, name, title, specialty, accent FROM stylists ORDER BY salon_id, id"))[0]?.rows ?? [];
      const stylists = stylistRows.map(r => ({ id: r[0], salonId: r[1], name: r[2], title: r[3], specialty: r[4], accent: r[5] }));

      const catRows = (await stdbSql(env, "SELECT id, slug, name, teaser FROM service_categories ORDER BY id"))[0]?.rows ?? [];
      const categories = catRows.map(r => ({ id: r[0], slug: r[1], name: r[2], teaser: r[3] }));

      const svcRows = (await stdbSql(env, "SELECT id, category_id, name, description, duration_minutes, price, badge, accent, tagline FROM services ORDER BY id"))[0]?.rows ?? [];
      const services = svcRows.map(r => ({ id: r[0], categoryId: r[1], name: r[2], description: r[3], durationMinutes: r[4], price: r[5], badge: r[6] ?? null, accent: r[7], tagline: r[8] }));

      const provRows = (await stdbSql(env, "SELECT id, name, region FROM provinces ORDER BY name"))[0]?.rows ?? [];
      const provinces = provRows.map(r => ({ id: r[0], name: r[1], region: r[2] }));

      data = { generatedAt: new Date().toISOString(), provinces, salons, stylists, categories, services };
    } catch (err) {
      console.error("STDB static fetch failed, using embedded fallback:", err.message);
      data = { ...STATIC_DATA, generatedAt: new Date().toISOString() };
    }
  } else {
    // No token configured — use embedded static data
    data = { ...STATIC_DATA, generatedAt: new Date().toISOString() };
  }

  const body = JSON.stringify(data);
  const responseToCache = new Response(body, {
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "s-maxage=3600" },
  });
  ctx.waitUntil(cache.put(cacheKey, responseToCache.clone()));

  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(origin), "X-Cache": "MISS" },
  });
}

async function handleSlots(request, env, ctx, origin) {
  const url = new URL(request.url);
  const salonIdStr = url.searchParams.get("salonId");
  const date = url.searchParams.get("date");

  // Validate params
  if (!salonIdStr || !date) {
    return errorResponse("Missing required params: salonId, date", 400, origin);
  }
  const salonId = parseInt(salonIdStr, 10);
  if (isNaN(salonId) || salonId <= 0) {
    return errorResponse("salonId must be a positive integer", 400, origin);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return errorResponse("date must be in YYYY-MM-DD format", 400, origin);
  }

  // Cache per (salonId, date) — 1 min
  const cache = caches.default;
  const cacheKey = new Request(`https://cache.internal/api/slots/${salonId}/${date}`);
  let cached = await cache.match(cacheKey);
  if (cached) {
    const body = await cached.text();
    return new Response(body, {
      headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(origin), "X-Cache": "HIT" },
    });
  }

  let slots;
  if (env.SPACETIMEDB_TOKEN) {
    try {
      const rows = await stdbSql(env, `
        SELECT id, salon_id, slot_date, slot_time, is_peak, is_available
        FROM time_slots
        WHERE salon_id = ${salonId} AND slot_date = '${date}'
        ORDER BY slot_time
      `);
      const raw = rows[0]?.rows ?? [];
      slots = raw.map(r => ({
        id: r[0], salonId: r[1], date: r[2], time: r[3],
        isPeak: Boolean(r[4]), isAvailable: Boolean(r[5]),
      }));
    } catch (err) {
      console.error("STDB slots fetch failed, using JS fallback:", err.message);
      // Determine day offset for this date from today
      const todayStr = getDateStr(0, Date.now());
      const todayMs = new Date(todayStr + "T00:00:00+07:00").getTime();
      const dateMs = new Date(date + "T00:00:00+07:00").getTime();
      const dayOffset = Math.max(0, Math.round((dateMs - todayMs) / 86400000));
      slots = generateSlotsForSalonAndDate(salonId, date, dayOffset);
    }
  } else {
    const todayStr = getDateStr(0, Date.now());
    const todayMs = new Date(todayStr + "T00:00:00+07:00").getTime();
    const dateMs = new Date(date + "T00:00:00+07:00").getTime();
    const dayOffset = Math.max(0, Math.round((dateMs - todayMs) / 86400000));
    slots = generateSlotsForSalonAndDate(salonId, date, dayOffset);
  }

  const body = JSON.stringify(slots);
  ctx.waitUntil(cache.put(cacheKey, new Response(body, {
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "s-maxage=60" },
  })));

  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(origin) },
  });
}

async function handleCreateBooking(request, env, origin) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", 400, origin);
  }

  const { salonId, stylistId, appointmentDate, appointmentTime, serviceIds, needsConsultation = false, customerName = "Guest" } = payload;

  // Basic validation
  if (!salonId || !stylistId || !appointmentDate || !appointmentTime || !Array.isArray(serviceIds)) {
    return errorResponse("Thieu thong tin dat lich.", 400, origin);
  }
  if (serviceIds.length === 0 && !needsConsultation) {
    return errorResponse("Vui long chon it nhat mot dich vu hoac yeu cau tu van.", 400, origin);
  }

  if (env.SPACETIMEDB_TOKEN) {
    try {
      await stdbReduce(env, "create_booking", [
        salonId, stylistId, appointmentDate, appointmentTime,
        serviceIds, needsConsultation, customerName,
      ]);
      // Generate confirmation code
      const code = `SN-${String(salonId).padStart(2, "0")}${Date.now().toString(36).toUpperCase().slice(-4)}`;
      const totalAmount = (STATIC_DATA.services.filter(s => serviceIds.includes(s.id)) || []).reduce((sum, s) => sum + s.price, 0);
      return jsonResponse({ ok: true, booking: { bookingId: Date.now(), totalAmount, confirmationCode: code } }, 201, origin);
    } catch (err) {
      // Pass STDB error to client (e.g. slot unavailable)
      return errorResponse(err.message || "Khong the dat lich.", 409, origin);
    }
  } else {
    // Fallback: simulate booking (useful for demo without STDB)
    const services = STATIC_DATA.services.filter(s => serviceIds.includes(s.id));
    const totalAmount = services.reduce((sum, s) => sum + s.price, 0);
    const bookingId = Date.now();
    const confirmationCode = `SN-${String(bookingId).padStart(4, "0").slice(-4)}`;
    return jsonResponse({ ok: true, booking: { bookingId, totalAmount, confirmationCode } }, 201, origin);
  }
}

// ─── Main fetch handler ─────────────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") ?? "";

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    const path = url.pathname;

    if (path === "/api/health") return handleHealth(origin);
    if (path === "/api/static" && request.method === "GET") return handleStatic(request, env, ctx, origin);
    if (path === "/api/slots" && request.method === "GET") return handleSlots(request, env, ctx, origin);
    if (path === "/api/bookings" && request.method === "POST") return handleCreateBooking(request, env, origin);

    return errorResponse("Not found", 404, origin);
  },
};
