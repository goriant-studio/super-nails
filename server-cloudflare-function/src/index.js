// Super Nails API — Cloudflare Worker
// Routes: /api/health, /api/static, /api/slots, /api/bookings

const STDB_BASE = "https://maincloud.spacetimedb.com";
const STDB_MODULE = "supernails"; // must match spacetime publish name

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
    { id: 1, name: "TP. Hồ Chí Minh", nameEn: "Ho Chi Minh City", nameVi: "TP. Hồ Chí Minh", region: "Miền Nam", regionEn: "South", regionVi: "Miền Nam" },
    { id: 2, name: "Hà Nội", nameEn: "Ha Noi", nameVi: "Hà Nội", region: "Miền Bắc", regionEn: "North", regionVi: "Miền Bắc" },
    { id: 3, name: "Đà Nẵng", nameEn: "Da Nang", nameVi: "Đà Nẵng", region: "Miền Trung", regionEn: "Central", regionVi: "Miền Trung" },
  ],
  salons: [
    { id: 1, provinceId: 1, provinceName: "TP. Hồ Chí Minh", name: "Super Nails - Riverside Q7", nameEn: "Super Nails - Riverside Q7", nameVi: "Super Nails - Riverside Q7", district: "Quận 7", city: "TP. Hồ Chí Minh", street: "420 Huỳnh Tấn Phát, P. Bình Thuận", shortAddress: "420 Huỳnh Tấn Phát, Q7", note: "Gần cầu Phú Mỹ, có bãi đỗ ô tô và phòng nail signature view sông.", noteEn: "Near Phu My Bridge. Car parking and signature nail room with river view.", noteVi: "Gần cầu Phú Mỹ, có bãi đỗ ô tô và phòng nail signature view sông.", travelMinutes: 12, distanceKm: 5.5, nearby: true, parking: true, premium: false, heroTone: "cobalt", gallery: ["Midnight gloss", "Blue facade", "Spa lounge"] },
    { id: 2, provinceId: 1, provinceName: "TP. Hồ Chí Minh", name: "Super Nails - Nguyễn Thị Thập", nameEn: "Super Nails - Nguyen Thi Thap", nameVi: "Super Nails - Nguyễn Thị Thập", district: "Quận 7", city: "TP. Hồ Chí Minh", street: "237 Nguyễn Thị Thập, P. Tân Phú", shortAddress: "237 Nguyễn Thị Thập, Q7", note: "Không gian sáng và nhanh, phù hợp booking sau giờ làm.", noteEn: "Bright and fast space, perfect for after-work bookings.", noteVi: "Không gian sáng và nhanh, phù hợp booking sau giờ làm.", travelMinutes: 14, distanceKm: 7.1, nearby: true, parking: false, premium: true, heroTone: "sunrise", gallery: ["Gold bar", "Express care", "Glass storefront"] },
    { id: 3, provinceId: 1, provinceName: "TP. Hồ Chí Minh", name: "Super Nails - Crescent Premium", nameEn: "Super Nails - Crescent Premium", nameVi: "Super Nails - Crescent Premium", district: "Quận 7", city: "TP. Hồ Chí Minh", street: "408 Nguyễn Thị Thập, P. Tân Quy", shortAddress: "408 Nguyễn Thị Thập, Q7", note: "Premium lounge, menu chăm sóc chuyên sâu và bãi đỗ xe rộng.", noteEn: "Premium lounge with specialized care menu and spacious parking.", noteVi: "Premium lounge, menu chăm sóc chuyên sâu và bãi đỗ xe rộng.", travelMinutes: 16, distanceKm: 7.5, nearby: true, parking: true, premium: true, heroTone: "emerald", gallery: ["Emerald lounge", "Private suite", "Art wall"] },
    { id: 4, provinceId: 1, provinceName: "TP. Hồ Chí Minh", name: "Super Nails - Trần Não", nameEn: "Super Nails - Tran Nao", nameVi: "Super Nails - Trần Não", district: "Quận 2", city: "TP. Hồ Chí Minh", street: "103 Trần Não, P. Bình An", shortAddress: "103 Trần Não, Quận 2", note: "Chi nhánh gần trung tâm mới, phù hợp combo chăm sóc da và nail art.", noteEn: "Branch near the new center, perfect for skincare and nail art combos.", noteVi: "Chi nhánh gần trung tâm mới, phù hợp combo chăm sóc da và nail art.", travelMinutes: 18, distanceKm: 9.1, nearby: false, parking: true, premium: true, heroTone: "violet", gallery: ["Sky blue", "Signature room", "Soft glow"] },
    { id: 5, provinceId: 1, provinceName: "TP. Hồ Chí Minh", name: "Super Nails - Tôn Đản", nameEn: "Super Nails - Ton Dan", nameVi: "Super Nails - Tôn Đản", district: "Quận 4", city: "TP. Hồ Chí Minh", street: "25 Tôn Đản, P. 13", shortAddress: "25 Tôn Đản, Quận 4", note: "Điểm hẹn nhanh cho khách yêu thích cuticle clean và gel box.", noteEn: "Quick appointment spot for cuticle care and gel box lovers.", noteVi: "Điểm hẹn nhanh cho khách yêu thích cuticle clean và gel box.", travelMinutes: 20, distanceKm: 9.7, nearby: false, parking: false, premium: true, heroTone: "rose", gallery: ["Rose studio", "Glass shelves", "Velvet seats"] },
    { id: 6, provinceId: 3, provinceName: "Đà Nẵng", name: "Super Nails - Hải Châu", nameEn: "Super Nails - Hai Chau", nameVi: "Super Nails - Hải Châu", district: "Hải Châu", city: "Đà Nẵng", street: "88 Bạch Đằng, Hải Châu", shortAddress: "88 Bạch Đằng, Đà Nẵng", note: "Phong cách resort, phù hợp khách du lịch muốn booking nhanh bằng PWA.", noteEn: "Resort style, perfect for tourists who want quick PWA booking.", noteVi: "Phong cách resort, phù hợp khách du lịch muốn booking nhanh bằng PWA.", travelMinutes: 11, distanceKm: 4.2, nearby: true, parking: true, premium: true, heroTone: "sand", gallery: ["Beach light", "Clean station", "River view"] },
  ],
  stylists: [
    { id: 1, salonId: 1, name: "Linh", title: "Nghệ nhân Nail", titleEn: "Master Nail Artist", titleVi: "Nghệ nhân Nail", specialty: "Gel ombré và charm đá", accent: "cobalt" },
    { id: 2, salonId: 1, name: "An", title: "Stylist Cao cấp", titleEn: "Senior Stylist", titleVi: "Stylist Cao cấp", specialty: "Pedicure spa và French tips", accent: "sunrise" },
    { id: 3, salonId: 1, name: "Vy", title: "Nghệ nhân Signature", titleEn: "Signature Artist", titleVi: "Nghệ nhân Signature", specialty: "Minimal chrome và cat eye", accent: "violet" },
    { id: 4, salonId: 2, name: "Hạnh", title: "Stylist Cao cấp", titleEn: "Senior Stylist", titleVi: "Stylist Cao cấp", specialty: "Combo nhanh sau giờ làm", accent: "emerald" },
    { id: 5, salonId: 2, name: "My", title: "Chuyên gia Màu sắc", titleEn: "Color Specialist", titleVi: "Chuyên gia Màu sắc", specialty: "Nhuộm nail jelly và seasonal palette", accent: "rose" },
    { id: 6, salonId: 3, name: "Nhi", title: "Nghệ nhân Premium", titleEn: "Premium Artist", titleVi: "Nghệ nhân Premium", specialty: "Builder gel và bridal set", accent: "gold" },
    { id: 7, salonId: 3, name: "Trâm", title: "Trưởng nhóm Spa", titleEn: "Spa Lead", titleVi: "Trưởng nhóm Spa", specialty: "Chăm sóc da tay chân chuyên sâu", accent: "emerald" },
    { id: 8, salonId: 4, name: "Thu", title: "Trưởng nhóm Sáng tạo", titleEn: "Creative Lead", titleVi: "Trưởng nhóm Sáng tạo", specialty: "Airbrush và line art", accent: "violet" },
    { id: 9, salonId: 4, name: "Bảo", title: "Stylist Spa", titleEn: "Spa Stylist", titleVi: "Stylist Spa", specialty: "Head spa và chăm sóc cuticle", accent: "sand" },
    { id: 10, salonId: 5, name: "Khánh", title: "Nghệ nhân Signature", titleEn: "Signature Artist", titleVi: "Nghệ nhân Signature", specialty: "Box short set và nude collection", accent: "rose" },
    { id: 11, salonId: 6, name: "Hà", title: "Stylist Resort", titleEn: "Resort Stylist", titleVi: "Stylist Resort", specialty: "Recovery spa và premium polish", accent: "sand" },
  ],
  categories: [
    { id: 1, slug: "combo-moi", name: "Combo mới và hot", nameEn: "New & Hot Combos", nameVi: "Combo mới và hot", teaser: "Những gói đang được đặt nhiều trong tuần", teaserEn: "Most booked packages this week", teaserVi: "Những gói đang được đặt nhiều trong tuần" },
    { id: 2, slug: "nail-co-ban", name: "Nail cơ bản", nameEn: "Basic Nails", nameVi: "Nail cơ bản", teaser: "Cắt da, sơn gel và design nhẹ cho lịch hẹn nhanh", teaserEn: "Cuticle trim, gel polish, and light design for quick appointments", teaserVi: "Cắt da, sơn gel và design nhẹ cho lịch hẹn nhanh" },
    { id: 3, slug: "nail-art", name: "Nail art và premium", nameEn: "Nail Art & Premium", nameVi: "Nail art và premium", teaser: "Builder gel, charm đá và bộ sưu tập đẹp sang", teaserEn: "Builder gel, charm stones, and beautiful collections", teaserVi: "Builder gel, charm đá và bộ sưu tập đẹp sang" },
    { id: 4, slug: "pedicure", name: "Pedicure và chăm sóc", nameEn: "Pedicure & Care", nameVi: "Pedicure và chăm sóc", teaser: "Làm sạch, massage và dưỡng ẩm chân", teaserEn: "Cleansing, massage, and foot moisturizing", teaserVi: "Làm sạch, massage và dưỡng ẩm chân" },
    { id: 5, slug: "spa", name: "Spa thư giãn", nameEn: "Relaxation Spa", nameVi: "Spa thư giãn", teaser: "Massage tay chân và phục hồi da", teaserEn: "Hand and foot massage and skin recovery", teaserVi: "Massage tay chân và phục hồi da" },
  ],
  services: [
    { id: 1, categoryId: 1, name: "Shine Combo 1", nameEn: "Shine Combo 1", nameVi: "Shine Combo 1", description: "Cắt da, sơn gel một màu và massage tay 10 phút.", descriptionEn: "Cuticle trim, single-color gel polish, and 10-minute hand massage.", descriptionVi: "Cắt da, sơn gel một màu và massage tay 10 phút.", durationMinutes: 45, price: 2500, badge: "Đồng giá cuối tuần", badgeEn: "Weekend flat rate", badgeVi: "Đồng giá cuối tuần", accent: "cobalt", tagline: "Nhanh, gọn và dễ đặt lịch", taglineEn: "Quick, neat and easy to book", taglineVi: "Nhanh, gọn và dễ đặt lịch" },
    { id: 2, categoryId: 1, name: "Shine Combo 2", nameEn: "Shine Combo 2", nameVi: "Shine Combo 2", description: "Cắt da, sơn gel, chăm sóc cuticle và đắp mặt nạ tay.", descriptionEn: "Cuticle trim, gel polish, cuticle care, and hand mask.", descriptionVi: "Cắt da, sơn gel, chăm sóc cuticle và đắp mặt nạ tay.", durationMinutes: 60, price: 4000, badge: "Mới", badgeEn: "New", badgeVi: "Mới", accent: "violet", tagline: "Combo dễ chốt lịch nhiều nhất", taglineEn: "Most booked combo", taglineVi: "Combo dễ chốt lịch nhiều nhất" },
    { id: 3, categoryId: 1, name: "Shine Combo 3", nameEn: "Shine Combo 3", nameVi: "Shine Combo 3", description: "Builder gel tự nhiên, massage cổ vai và phụ kiện nhẹ.", descriptionEn: "Natural builder gel, shoulder massage, and light accessories.", descriptionVi: "Builder gel tự nhiên, massage cổ vai và phụ kiện nhẹ.", durationMinutes: 75, price: 5500, badge: "Premium", badgeEn: "Premium", badgeVi: "Premium", accent: "emerald", tagline: "Đi kèm thư giãn cổ vai gáy", taglineEn: "Includes shoulder relaxation", taglineVi: "Đi kèm thư giãn cổ vai gáy" },
    { id: 4, categoryId: 2, name: "Cắt xả express", nameEn: "Express Trim", nameVi: "Cắt xả express", description: "Cắt da nhanh, dưỡng móng và sơn dưỡng bóng.", descriptionEn: "Quick cuticle trim, nail nourishing, and shine coat.", descriptionVi: "Cắt da nhanh, dưỡng móng và sơn dưỡng bóng.", durationMinutes: 30, price: 1800, badge: null, badgeEn: null, badgeVi: null, accent: "sunrise", tagline: "Phù hợp lịch hẹn 30 phút", taglineEn: "Perfect for a 30-minute appointment", taglineVi: "Phù hợp lịch hẹn 30 phút" },
    { id: 5, categoryId: 2, name: "French tip soft", nameEn: "Soft French Tips", nameVi: "French tip soft", description: "Nền gel trong và vẽ French tip tay cong mềm.", descriptionEn: "Clear gel base and soft curved French tip painting.", descriptionVi: "Nền gel trong và vẽ French tip tay cong mềm.", durationMinutes: 40, price: 3000, badge: null, badgeEn: null, badgeVi: null, accent: "cobalt", tagline: "Classic nhưng vẫn rất sang", taglineEn: "Classic yet elegant", taglineVi: "Classic nhưng vẫn rất sang" },
    { id: 6, categoryId: 3, name: "Cat eye galaxy", nameEn: "Cat Eye Galaxy", nameVi: "Cat eye galaxy", description: "Sơn gel cat eye nhiều lớp và hiệu ứng ánh kim.", descriptionEn: "Multi-layer cat eye gel polish with metallic effect.", descriptionVi: "Sơn gel cat eye nhiều lớp và hiệu ứng ánh kim.", durationMinutes: 55, price: 3500, badge: "Hot trend", badgeEn: "Hot trend", badgeVi: "Hot trend", accent: "violet", tagline: "Lên ảnh đẹp trên iPhone", taglineEn: "Looks amazing on camera", taglineVi: "Lên ảnh đẹp trên iPhone" },
    { id: 7, categoryId: 3, name: "Bridal crystal set", nameEn: "Bridal Crystal Set", nameVi: "Bridal crystal set", description: "Bộ nail cưới với charm đá, line art và builder gel.", descriptionEn: "Bridal nail set with crystal charms, line art, and builder gel.", descriptionVi: "Bộ nail cưới với charm đá, line art và builder gel.", durationMinutes: 90, price: 7500, badge: "Premium", badgeEn: "Premium", badgeVi: "Premium", accent: "gold", tagline: "Dành cho ngày đặc biệt", taglineEn: "For your special day", taglineVi: "Dành cho ngày đặc biệt" },
    { id: 8, categoryId: 4, name: "Pedicure refresh", nameEn: "Pedicure Refresh", nameVi: "Pedicure refresh", description: "Làm sạch góc chân, tẩy da chết và sơn gel chân.", descriptionEn: "Foot cleaning, exfoliation, and gel polish.", descriptionVi: "Làm sạch góc chân, tẩy da chết và sơn gel chân.", durationMinutes: 50, price: 3200, badge: null, badgeEn: null, badgeVi: null, accent: "emerald", tagline: "Chân nhẹ và sạch sẽ hơn", taglineEn: "Lighter and cleaner feet", taglineVi: "Chân nhẹ và sạch sẽ hơn" },
    { id: 9, categoryId: 4, name: "Luxury spa pedicure", nameEn: "Luxury Spa Pedicure", nameVi: "Luxury spa pedicure", description: "Pedicure có massage đá nóng, muối ngâm và serum phục hồi.", descriptionEn: "Pedicure with hot stone massage, salt soak, and recovery serum.", descriptionVi: "Pedicure có massage đá nóng, muối ngâm và serum phục hồi.", durationMinutes: 65, price: 4800, badge: "Thư giãn", badgeEn: "Relaxing", badgeVi: "Thư giãn", accent: "sand", tagline: "Rất hợp cho cuối tuần", taglineEn: "Perfect for weekends", taglineVi: "Rất hợp cho cuối tuần" },
    { id: 10, categoryId: 5, name: "Hand recovery ritual", nameEn: "Hand Recovery Ritual", nameVi: "Hand recovery ritual", description: "Tẩy tế bào chết, massage, serum và paraffin mềm da.", descriptionEn: "Exfoliation, massage, serum, and paraffin for soft skin.", descriptionVi: "Tẩy tế bào chết, massage, serum và paraffin mềm da.", durationMinutes: 35, price: 2800, badge: null, badgeEn: null, badgeVi: null, accent: "rose", tagline: "Dưỡng ẩm và phục hồi nhanh", taglineEn: "Moisturize and recover quickly", taglineVi: "Dưỡng ẩm và phục hồi nhanh" },
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
    // All slots start available — bookings mark them unavailable
    return { id: salonId * 10000 + dayOffset * 100 + slotIndex, salonId, date: dateStr, time, isPeak, isAvailable: true };
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
        FROM salon s JOIN province p ON p.id = s.province_id
        ORDER BY s.nearby DESC, s.premium DESC, s.distance_km ASC
      `);
      const salonsRaw = rows[0]?.rows ?? [];
      const salons = salonsRaw.map(r => ({
        id: r[0], provinceId: r[1], provinceName: r[2], name: r[3], district: r[4],
        city: r[5], street: r[6], shortAddress: r[7], note: r[8], travelMinutes: r[9],
        distanceKm: r[10], nearby: r[11], parking: r[12], premium: r[13], heroTone: r[14],
        gallery: JSON.parse(r[15] ?? "[]"),
      }));

      const stylistRows = (await stdbSql(env, "SELECT id, salon_id, name, title, specialty, accent FROM stylist ORDER BY salon_id, id"))[0]?.rows ?? [];
      const stylists = stylistRows.map(r => ({ id: r[0], salonId: r[1], name: r[2], title: r[3], specialty: r[4], accent: r[5] }));

      const catRows = (await stdbSql(env, "SELECT id, slug, name, teaser FROM service_category ORDER BY id"))[0]?.rows ?? [];
      const categories = catRows.map(r => ({ id: r[0], slug: r[1], name: r[2], teaser: r[3] }));

      const svcRows = (await stdbSql(env, "SELECT id, category_id, name, description, duration_minutes, price, badge, accent, tagline FROM service ORDER BY id"))[0]?.rows ?? [];
      const services = svcRows.map(r => ({ id: r[0], categoryId: r[1], name: r[2], description: r[3], durationMinutes: r[4], price: r[5], badge: r[6] ?? null, accent: r[7], tagline: r[8] }));

      const provRows = (await stdbSql(env, "SELECT id, name, region FROM province ORDER BY name"))[0]?.rows ?? [];
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

  // No caching for slots — availability is real-time

  let slots;
  if (env.SPACETIMEDB_TOKEN) {
    try {
      const rows = await stdbSql(env, `
        SELECT id, salon_id, slot_date, slot_time, is_peak, is_available
        FROM time_slot
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

  // No cache for slots — availability changes on every booking
  const body = JSON.stringify(slots);

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

  const { salonId, stylistId, appointmentDate, appointmentTime, serviceIds, needsConsultation = false, customerName = "Guest", paymentMethod = "cash", tipAmount = 0 } = payload;

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
        serviceIds, needsConsultation, customerName, paymentMethod, tipAmount,
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
