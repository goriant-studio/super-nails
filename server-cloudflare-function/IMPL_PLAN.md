# Implementation Plan: Cloudflare Workers + SpacetimeDB

## Mục tiêu
Thay thế Express server + SQLite local bằng stack **hoàn toàn free**:
- **GitHub Pages** — Static FE hosting + CDN (Fastly, built-in)
- **Cloudflare Workers** (JS) — API layer, edge runtime, CORS gateway
- **SpacetimeDB Maincloud** — Database + server logic, free 2,500 TeV/month (~3M calls)

---

## Architecture

```
[Browser / PWA]
      │ HTTPS
      ▼
[GitHub Pages]              ← Static FE (Vite + React + Tailwind)
  goriant-studio.github.io/super-nails
  (CDN: Fastly, global, free, auto-deploy on push)
      │ HTTPS  /api/*
      ▼
[Cloudflare Worker]         ← API Gateway (JS), wrangler deploy
  super-nails.goriant.com/api/*
  • CORS headers
  • Request routing & validation
  • SpacetimeDB token injection (via env secret)
      │ HTTP POST/GET
      ▼
[SpacetimeDB Maincloud]     ← DB + Logic (Rust module)
  maincloud.spacetimedb.com
  module: super-nails
```

---

## Free Quota

| Service | Free Tier |
|---------|----------|
| GitHub Pages | Free, unlimited bandwidth, CDN Fastly |
| Cloudflare Workers | 100,000 req/day, 10ms CPU/req |
| SpacetimeDB Maincloud | 2,500 TeV/month ≈ 3M reducer calls, 1GB storage, 5 DBs |

→ **~100 transactions/day ≈ <0.1% quota** của cả 3 platform.

---

## DB Design Schema (SpacetimeDB / Rust)

> Ported từ `server/src/db.js` (SQLite hiện tại), với adjustments cho SpacetimeDB data model.

### Entity-Relationship

```
Province (1) ──< Salon (1) ──< Stylist
                     │
                     └──< TimeSlot
                     └──< Booking >─── BookingService >── Service
                                                              │
                                                        ServiceCategory
```

### Table Definitions

```rust
// Province
#[spacetimedb::table(name = provinces, public)]
pub struct Province {
    #[primary_key]
    #[auto_inc]
    pub id: u32,
    pub name: String,       // UNIQUE, e.g. "TP Ho Chi Minh"
    pub region: String,     // "Mien Nam" | "Mien Bac" | "Mien Trung"
}

// Salon
#[spacetimedb::table(name = salons, public)]
pub struct Salon {
    #[primary_key]
    #[auto_inc]
    pub id: u32,
    pub province_id: u32,
    pub name: String,
    pub district: String,
    pub city: String,
    pub street: String,
    pub short_address: String,
    pub note: String,
    pub travel_minutes: u32,
    pub distance_km: f32,
    pub nearby: bool,
    pub parking: bool,
    pub premium: bool,
    pub hero_tone: String,      // "cobalt" | "emerald" | "rose" | ...
    pub gallery_json: String,   // JSON array of strings (SpacetimeDB không có array native)
}

// Stylist
#[spacetimedb::table(name = stylists, public)]
pub struct Stylist {
    #[primary_key]
    #[auto_inc]
    pub id: u32,
    pub salon_id: u32,
    pub name: String,
    pub title: String,      // "Master Nail Artist" | "Senior Stylist" | ...
    pub specialty: String,
    pub accent: String,
}

// ServiceCategory
#[spacetimedb::table(name = service_categories, public)]
pub struct ServiceCategory {
    #[primary_key]
    #[auto_inc]
    pub id: u32,
    pub slug: String,       // UNIQUE, e.g. "combo-moi"
    pub name: String,
    pub teaser: String,
}

// Service
#[spacetimedb::table(name = services, public)]
pub struct Service {
    #[primary_key]
    #[auto_inc]
    pub id: u32,
    pub category_id: u32,
    pub name: String,
    pub description: String,
    pub duration_minutes: u32,
    pub price: u32,             // VND, integer (no decimals)
    pub badge: Option<String>,  // nullable: "Hot trend" | "Premium" | null
    pub accent: String,
    pub tagline: String,
}

// TimeSlot
// UNIQUE constraint: (salon_id, slot_date, slot_time)
#[spacetimedb::table(name = time_slots, public)]
pub struct TimeSlot {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub salon_id: u32,
    pub slot_date: String,  // "YYYY-MM-DD" (local VN time)
    pub slot_time: String,  // "HH:MM" (local VN time)
    pub is_peak: bool,      // weekend || hour >= 18
    pub is_available: bool,
}

// Booking
#[spacetimedb::table(name = bookings, public)]
pub struct Booking {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub salon_id: u32,
    pub stylist_id: u32,
    pub appointment_date: String,   // "YYYY-MM-DD"
    pub appointment_time: String,   // "HH:MM"
    pub customer_name: String,      // default: "Guest"
    pub needs_consultation: bool,
    pub total_amount: u32,          // VND
    pub created_at: String,         // ISO 8601 timestamp
}

// BookingService (many-to-many junction)
#[spacetimedb::table(name = booking_services, public)]
pub struct BookingService {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub booking_id: u64,
    pub service_id: u32,
}
```

### Time Slots Schedule
- **Giờ hoạt động**: 10:00 → 21:20 (bước 20 phút = 34 slots/ngày/salon)
- **Peak hours**: cuối tuần (Sat/Sun) hoặc hour ≥ 18
- **Tầm nhìn**: generate slots cho 6 ngày tới (sliding window)
- **Busy pattern seed** (mock data): `(salon_id * 11 + dayOffset * 5 + slotIndex) % 9`

---

## Edge Cases & Potential Bugs

### 1. 🚨 Race Condition — Double Booking (CRITICAL)

**Vấn đề**: Hai request `POST /api/bookings` cùng lúc cho cùng `(salon_id, slot_date, slot_time)`.

SQLite giải quyết bằng transaction + file lock. **SpacetimeDB reducers được serialized** (chạy tuần tự trong WASM) → race condition không xảy ra ở DB layer.

**Tuy nhiên cần guard**:
```rust
// Trong create_booking reducer — kiểm tra lại trong transaction
let slot = TimeSlot::filter_by_salon_id_and_slot_date_and_slot_time(...)
    .find(|s| s.salon_id == salon_id && s.slot_date == date && s.slot_time == time);

match slot {
    None => return Err("Khung giờ không tồn tại.".into()),
    Some(s) if !s.is_available => return Err("Khung giờ đã được đặt.".into()),
    Some(s) => { /* proceed */ }
}
```

### 2. ⚠️ Stylist-Salon Mismatch

**Vấn đề**: Client gửi `stylistId` không thuộc `salonId`.

**Fix**: Validate trong reducer:
```rust
let stylist = Stylist::filter_by_id(stylist_id)
    .find(|s| s.salon_id == salon_id);
if stylist.is_none() {
    return Err("Stylist không thuộc salon đã chọn.".into());
}
```

### 3. ⚠️ Past Date Booking

**Vấn đề**: Client gửi `appointmentDate` là ngày hôm qua hoặc quá khứ.

**Fix trong reducer**: SpacetimeDB có `spacetimedb::Timestamp::now()`, so sánh date:
```rust
// slot_date phải >= today (VN timezone = UTC+7)
let now_utc = Timestamp::now().to_duration_since_unix_epoch().as_secs();
let today_vn = (now_utc + 7 * 3600) / 86400; // days since epoch in VN tz
// parse slot_date và so sánh
```

### 4. ⚠️ Empty serviceIds + needsConsultation = false

**Vấn đề**: Booking không có service nào và không cần tư vấn → `total_amount = 0`, booking vô nghĩa.

**Fix**:
```rust
if service_ids.is_empty() && !needs_consultation {
    return Err("Vui lòng chọn ít nhất một dịch vụ hoặc yêu cầu tư vấn.".into());
}
```

### 5. ⚠️ Invalid serviceId trong array

**Vấn đề**: `serviceIds: [1, 999]` — id 999 không tồn tại → total_amount tính sai.

**Fix**: Validate tất cả serviceIds trước khi sum:
```rust
let mut total = 0u32;
for sid in &service_ids {
    match Service::filter_by_id(*sid).next() {
        None => return Err(format!("Service id={} không tồn tại.", sid).into()),
        Some(s) => total += s.price,
    }
}
```

### 6. ⚠️ RefreshTimeSlots xóa hết slots kể cả đã booked

**Vấn đề hiện tại** (trong `db.js`): `DELETE FROM time_slots` rồi INSERT lại → sau đó mới re-apply bookings. **Nếu giữa DELETE và re-apply có crash → mất consistency.**

**Fix cho SpacetimeDB approach**: Thay vì delete-all, dùng **upsert** — chỉ thêm slots mới, không xóa slots đã tồn tại:
```rust
// Kiểm tra trước khi insert
if TimeSlot::filter_by_salon_id(salon_id)
    .find(|s| s.slot_date == date && s.slot_time == time)
    .is_none()
{
    TimeSlot::insert(new_slot);
}
// Slots cũ có booking vẫn còn is_available = false
```

### 7. ⚠️ CORS Preflight bị miss

**Vấn đề**: Browser gửi `OPTIONS` preflight trước POST → Worker cần handle:
```js
if (request.method === 'OPTIONS') {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
```

### 8. ⚠️ SpacetimeDB token hết hạn

**Vấn đề**: `SPACETIMEDB_TOKEN` không được rotate → sau X tháng gọi API bị 401.

**Fix**: Set up token rotation reminder, hoặc dùng service account token với long TTL.

### 9. ⚠️ Bootstrap payload quá lớn

**Vấn đề**: Bootstrap trả về tất cả salons + services + time_slots. 6 salons × 34 slots × 6 ngày = **1,224 time_slot rows/request**. Sẽ tăng khi scale.

→ Xem phần Performance bên dưới.

---

## Performance Optimizations

### 1. Bootstrap Caching (Cloudflare Cache API)

Static data (salons, services, categories) không đổi thường xuyên → cache tại Cloudflare edge:

```js
// Worker: cache bootstrap response 5 phút
const cacheKey = new Request('https://cache.internal/bootstrap', request);
const cache = caches.default;

let response = await cache.match(cacheKey);
if (!response) {
  response = await fetchBootstrapFromSpacetimeDB(env);
  response = new Response(response.body, response);
  response.headers.set('Cache-Control', 's-maxage=300'); // 5 min
  ctx.waitUntil(cache.put(cacheKey, response.clone()));
}
return response;
```

**Lợi ích**: ~99% requests không hit SpacetimeDB → tiết kiệm TeV quota.

### 2. Tách API: Static vs Dynamic

Thay vì 1 call bootstrap lớn, tách thành:

| Endpoint | Data | Cache TTL |
|----------|------|-----------|
| `GET /api/static` | salons, services, categories | 1 giờ |
| `GET /api/slots?salonId=X&date=Y` | time_slots theo salon+date | 1 phút |
| `POST /api/bookings` | create booking | không cache |

→ Giảm payload ~80%, slots luôn fresh.

### 3. Indexes trên TimeSlot

SpacetimeDB không có native SQL index nhưng hỗ trợ **multi-column filter**. Đảm bảo query slots luôn filter theo `salon_id` + `slot_date` (không scan toàn table):

```rust
// Thêm index helper
#[spacetimedb::table(name = time_slots, public)]
#[spacetimedb::index(btree, name = "by_salon_date", columns = [salon_id, slot_date])]
pub struct TimeSlot { ... }
```

### 4. Slot Generation — Chỉ generate forward

Hiện tại `refreshTimeSlots()` delete all và regenerate từ đầu. Thay bằng:
- Chỉ generate ngày mới (ngày chưa có slots)
- Chạy scheduled reducer 1 lần/ngày (SpacetimeDB có cron-like scheduled reducers)

```rust
#[spacetimedb::reducer(repeat = 86400000000)] // 24h in microseconds
pub fn daily_slot_refresh(ctx: &ReducerContext) {
    let target_date = today_vn() + 6; // chỉ generate ngày thứ 7
    generate_slots_for_date(target_date);
    // Xóa slots cũ hơn 1 ngày (quá khứ)
    cleanup_past_slots(ctx);
}
```

### 5. Cloudflare Worker — Reuse Connections

SpacetimeDB HTTP calls từ Worker nên dùng `fetch` với `keepAlive` (default trong Workers):
```js
const STDB_BASE = 'https://maincloud.spacetimedb.com';
// fetch() trong CF Workers tự reuse connections → không cần config thêm
```

### 6. Response Compression

Cloudflare tự gzip responses, nhưng cần set đúng headers:
```js
response.headers.set('Content-Type', 'application/json; charset=utf-8');
// CF tự compress nếu client gửi Accept-Encoding: gzip
```

---

## ✅ Đã có

| Layer | Status |
|-------|--------|
| FE Static hosting | ✅ GitHub Pages + CI/CD auto-deploy |
| CDN | ✅ GitHub Pages dùng Fastly CDN (global) |
| Cloudflare Worker boilerplate | ✅ `cloudflare-worker/` + `wrangler.toml` |
| DB schema (SQLite reference) | ✅ `server/src/db.js` (source of truth cũ) |

---

## ❌ Còn thiếu — Cần implement

### 1. CORS trên Cloudflare Worker
```js
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://goriant-studio.github.io",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle preflight
if (request.method === 'OPTIONS') {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
```

### 2. SpacetimeDB Module (Rust) — chưa viết
File: `spacetimedb-module/src/lib.rs`
- Tables theo schema ở trên
- Reducers: `seed_static_data`, `create_booking`, `daily_slot_refresh`

### 3. Worker index.js — chưa implement

**`GET /api/static`** — Tách từ bootstrap, cache 1h
```js
// POST /v1/database/super-nails/sql
// SELECT salons JOIN provinces, services JOIN categories, stylists
```

**`GET /api/slots?salonId=X&date=Y`** — Cache 1 min
```js
// POST /v1/database/super-nails/sql
// SELECT * FROM time_slots WHERE salon_id=X AND slot_date=Y
```

**`POST /api/bookings`**
```js
// POST /v1/database/super-nails/call/create_booking
// Body: { salonId, stylistId, serviceIds, appointmentDate, appointmentTime, customerName, needsConsultation }
```

**`GET /api/health`**

### 4. Environment Secrets
```bash
wrangler secret put SPACETIMEDB_TOKEN
# Token từ SpacetimeDB Maincloud dashboard
```

### 5. CI/CD — Thêm job deploy Worker
```yaml
# Thêm vào .github/workflows/deploy.yml
deploy-worker:
  runs-on: ubuntu-latest
  needs: build
  steps:
    - uses: actions/checkout@v4
    - uses: cloudflare/wrangler-action@v3
      with:
        apiToken: ${{ secrets.CF_API_TOKEN }}
        workingDirectory: server-cloudflare-function
```
→ Cần add `CF_API_TOKEN` vào GitHub Repository Secrets.

### 6. Frontend API URL
```env
# client/.env
VITE_API_URL=https://super-nails.goriant.com/api
```

---

## Migration từ Express

| Express (cũ) | Cloudflare Worker + SpacetimeDB (mới) |
|---|---|
| `server/src/db.js` SQLite | SpacetimeDB Rust module — cloud |
| `server/src/index.js` Express | `server-cloudflare-function/src/index.js` Worker JS |
| `npm run start` on VPS | `wrangler deploy` → auto scale |
| DB file mất khi restart | SpacetimeDB persistent cloud |
| 1 bootstrap call (salons+slots) | Tách `/api/static` (cached) + `/api/slots` (fresh) |

---

## Implementation Steps

- [ ] **Bước 1** — Setup SpacetimeDB Maincloud account, cài `spacetime` CLI
- [ ] **Bước 2** — Viết SpacetimeDB module (Rust): tables + reducers, publish lên Maincloud
- [ ] **Bước 3** — Viết Worker `src/index.js`: routing + CORS + Bootstrap cache + SpacetimeDB HTTP calls
- [ ] **Bước 4** — Config `wrangler.toml`, set `SPACETIMEDB_TOKEN` secret
- [ ] **Bước 5** — Update `client/.env` → `VITE_API_URL`, update `api.ts` cho endpoint mới (`/static`, `/slots`)
- [ ] **Bước 6** — Thêm job `deploy-worker` vào `.github/workflows/deploy.yml`, add `CF_API_TOKEN` GitHub Secret
- [ ] **Bước 7** — Verify end-to-end: `/api/static` → salon list, `/api/slots` → time slots, `POST /api/bookings` → booking thành công

---

## Lưu ý

> **SpacetimeDB module viết bằng Rust** (bắt buộc — chạy IN database).
> **Cloudflare Worker viết bằng JS** — API gateway thuần JS.
>
> Nếu muốn **100% JS** → thay SpacetimeDB bằng **Cloudflare D1** (SQLite-compatible, free 5GB, không cần Rust).

---

## 🔍 Review Notes (2025-03-15)

> Sau khi cross-check với codebase hiện tại (`server/src/db.js`, `server/src/index.js`, `cloudflare-worker/`, `client/src/api.ts`) và SpacetimeDB docs.

### 🚨 CRITICAL — SpacetimeDB Rust API Syntax Sai

#### Issue 1: `filter_by_` compound không tồn tại
```rust
// ❌ Plan viết:
TimeSlot::filter_by_salon_id_and_slot_date_and_slot_time(...)

// ✅ SpacetimeDB chỉ generate filter_by_<single_column>, phải chain thủ công:
TimeSlot::filter_by_salon_id(&ctx, &salon_id)
    .find(|s| s.slot_date == date && s.slot_time == time)
```

#### Issue 2: Scheduled reducer syntax sai
```rust
// ❌ Plan viết:
#[spacetimedb::reducer(repeat = 86400000000)]

// ✅ SpacetimeDB dùng spacetimedb::schedule!() macro từ trong reducer khác,
// KHÔNG có annotation-based scheduling:
spacetimedb::schedule!("daily_slot_refresh", schedule_at);
```

#### Issue 3: `Timestamp::now()` không đúng context
```rust
// ❌ Plan viết:
let now_utc = Timestamp::now().to_duration_since_unix_epoch().as_secs();

// ✅ Trong reducer, lấy timestamp từ ReducerContext:
let now = ctx.timestamp;
```

#### Issue 4: BTree index macro syntax
```rust
// ❌ Plan viết:
#[spacetimedb::index(btree, name = "by_salon_date", columns = [salon_id, slot_date])]

// ✅ Syntax đúng (check SpacetimeDB SDK version tại thời điểm impl):
#[index(btree)]  // trên individual column
// Hoặc multi-column index cần verify lại docs mới nhất
```

---

### ⚠️ MEDIUM — Logic / Data Bugs

#### Issue 5: Slot count sai — Plan ghi 34, thực tế 32
Plan nói "34 slots/ngày/salon", nhưng `db.js` chỉ có **32 time entries** (10:00 → 21:20, bước 20 phút, bỏ nghỉ trưa 12:20 + 12:40). Tính lại:
- 10:00–11:40: 6 slots
- 12:00–12:00: 1 slot (bỏ 12:20, 12:40)
- 13:00–14:20: 4 slots
- 15:00–16:40: 6 slots
- 17:00–21:20: 14 slots
- **Tổng = 32 slots**, KHÔNG phải 34.

→ Sửa "34 slots/ngày/salon" → "32 slots/ngày/salon" và payload estimate: `6 × 32 × 6 = 1,152` (không phải 1,224).

#### Issue 6: CORS Origin thiếu domain
```js
// ❌ Plan chỉ allow:
"Access-Control-Allow-Origin": "https://goriant-studio.github.io"

// ✅ App CŨNG được serve qua super-nails.goriant.com (Cloudflare Worker proxy).
// Cần dynamic origin check:
const ALLOWED_ORIGINS = [
  "https://goriant-studio.github.io",
  "https://super-nails.goriant.com"
];
const origin = request.headers.get("Origin");
if (ALLOWED_ORIGINS.includes(origin)) {
  headers["Access-Control-Allow-Origin"] = origin;
}
```

Bonus: dev mode cần thêm `http://localhost:5173` (Vite dev server).

#### Issue 7: Bootstrap cache key có thể vary
```js
// ❌ Plan viết:
const cacheKey = new Request('https://cache.internal/bootstrap', request);
// Nếu client request có query params, cache key sẽ vary → cache miss

// ✅ Fix: dùng static key, không kế thừa request:
const cacheKey = new Request('https://cache.internal/api/static');
```

---

### ⚠️ MEDIUM — Architecture / Project Structure

#### Issue 8: Directory naming conflict
- Plan nằm trong `server-cloudflare-function/` (chỉ có IMPL_PLAN.md, chưa có code)
- Worker boilerplate **thực tế** ở `cloudflare-worker/` (reverse proxy GitHub Pages)
- Còn `cloudflare-worker-v2/` (reverse proxy lovable.app)

**Cần quyết định**:
- Dùng `server-cloudflare-function/` như project mới cho API Worker? → OK, nhưng cần clarify trong plan.
- Hay extend `cloudflare-worker/` hiện có để thêm `/api/*` routing? → Tiết kiệm hơn (1 Worker = proxy + API).
- `cloudflare-worker-v2/` có còn dùng không? Cleanup?

#### Issue 9: Frontend migration gap
`client/src/api.ts` hiện tại:
- `fetchBootstrapData()` → gọi `/api/bootstrap`, fallback `bootstrap.json` static
- `submitBookingRequest()` → gọi `/api/bookings`

Plan tách thành `/api/static` + `/api/slots?salonId=X&date=Y` nhưng CHƯA specify:
1. `fetchBootstrapData()` phải gọi 2 API song song? Hay merge response?
2. `BootstrapData` type interface cần thay đổi? (hiện có `timeSlots: TimeSlot[]` trong response)
3. Fallback static JSON (`bootstrap.json`) còn hoạt động không? Hay cần tách thành `static.json` + `slots.json`?
4. Loading UX: slots load lazy per salon hay load all lúc đầu?

→ **Cần thêm section chi tiết cho Frontend API migration.**

---

### 💡 MINOR — Suggestions

#### Issue 10: Thiếu `customer_phone` field
Cả SQLite schema và plan đều không có `customer_phone` trong `bookings` table. Cho demo thì OK, nhưng nếu muốn realistic thì nên thêm:
```rust
pub customer_phone: Option<String>,
```

#### Issue 11: `gallery_json` serialization
Plan note "SpacetimeDB không có array native" nhưng không mention cách parse JSON string trong reducer. Nên thêm note:
- Reducers cần `serde_json` dependency để parse/serialize `gallery_json`
- Hoặc dùng SpacetimeDB's `Vec<String>` nếu SDK version mới hỗ trợ

#### Issue 12: Missing `GET /api/slots` input validation
Plan mô tả endpoint `GET /api/slots?salonId=X&date=Y` nhưng không mention:
- Validate `salonId` là số hợp lệ
- Validate `date` format `YYYY-MM-DD`
- Return 400 nếu thiếu params

#### Issue 13: SpacetimeDB module naming
Plan dùng `module: super-nails` — SpacetimeDB module name có thể không cho phép dấu `-`. Cần verify, có thể phải dùng `super_nails` (underscore).
