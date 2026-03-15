use spacetimedb::{table, reducer, Table, ReducerContext};

// ─────────────────────────────────────────────
// Tables
// ─────────────────────────────────────────────

#[table(name = provinces, public)]
pub struct Province {
    #[primary_key]
    #[auto_inc]
    pub id: u32,
    pub name: String,
    pub name_en: String,
    pub name_vi: String,
    pub region: String,
}

#[table(name = salons, public)]
pub struct Salon {
    #[primary_key]
    #[auto_inc]
    pub id: u32,
    pub province_id: u32,
    pub name: String,
    pub name_en: String,
    pub name_vi: String,
    pub district: String,
    pub city: String,
    pub street: String,
    pub short_address: String,
    pub note: String,
    pub note_en: String,
    pub note_vi: String,
    pub travel_minutes: u32,
    pub distance_km: f32,
    pub nearby: bool,
    pub parking: bool,
    pub premium: bool,
    pub hero_tone: String,
    pub gallery_json: String,
}

#[table(name = stylists, public)]
pub struct Stylist {
    #[primary_key]
    #[auto_inc]
    pub id: u32,
    pub salon_id: u32,
    pub name: String,
    pub title: String,
    pub title_en: String,
    pub title_vi: String,
    pub specialty: String,
    pub specialty_en: String,
    pub specialty_vi: String,
    pub accent: String,
}

#[table(name = service_categories, public)]
pub struct ServiceCategory {
    #[primary_key]
    #[auto_inc]
    pub id: u32,
    pub slug: String,
    pub name: String,
    pub name_en: String,
    pub name_vi: String,
    pub teaser: String,
    pub teaser_en: String,
    pub teaser_vi: String,
}

#[table(name = services, public)]
pub struct Service {
    #[primary_key]
    #[auto_inc]
    pub id: u32,
    pub category_id: u32,
    pub name: String,
    pub name_en: String,
    pub name_vi: String,
    pub description: String,
    pub description_en: String,
    pub description_vi: String,
    pub duration_minutes: u32,
    /// Price in USD cents (e.g. 3000 = $30.00)
    pub price: u32,
    pub badge: Option<String>,
    pub badge_en: Option<String>,
    pub badge_vi: Option<String>,
    pub accent: String,
    pub tagline: String,
    pub tagline_en: String,
    pub tagline_vi: String,
}

#[table(name = time_slots, public)]
pub struct TimeSlot {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub salon_id: u32,
    pub slot_date: String,
    pub slot_time: String,
    pub is_peak: bool,
    pub is_available: bool,
}

#[table(name = bookings, public)]
pub struct Booking {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub salon_id: u32,
    pub stylist_id: u32,
    pub appointment_date: String,
    pub appointment_time: String,
    pub customer_name: String,
    pub needs_consultation: bool,
    /// Total amount in USD cents (subtotal + tax + tip)
    pub total_amount: u32,
    /// Tax amount in USD cents
    pub tax_amount: u32,
    /// Tip amount in USD cents
    pub tip_amount: u32,
    /// Payment method: "card", "cash", "digital_wallet"
    pub payment_method: String,
    /// Current tour status: "booked", "confirmed", etc.
    pub current_status: String,
    pub created_at: String,
}

#[table(name = booking_services, public)]
pub struct BookingService {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub booking_id: u64,
    pub service_id: u32,
}

#[table(name = booking_statuses, public)]
pub struct BookingStatus {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub booking_id: u64,
    pub status: String,
    pub changed_at: String,
}

#[table(name = feedbacks, public)]
pub struct Feedback {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub booking_id: u64,
    pub rating: u32,
    pub comment: String,
    pub created_at: String,
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

/// Tax rate: 8.875%
const TAX_RATE_NUM: u32 = 8875;
const TAX_RATE_DEN: u32 = 100000;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

static TIME_SLOTS: &[&str] = &[
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

fn epoch_ms_to_vn_date(epoch_ms: i64) -> String {
    let vn_secs = epoch_ms / 1000 + 7 * 3600;
    let days = (vn_secs / 86400) as u64;
    let (y, m, d) = days_to_ymd(days);
    format!("{:04}-{:02}-{:02}", y, m, d)
}

fn days_to_ymd(days: u64) -> (u64, u64, u64) {
    let z = days as i64 + 719468;
    let era = if z >= 0 { z } else { z - 146096 } / 146097;
    let doe = (z - era * 146097) as u64;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe as i64 + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = if m <= 2 { y + 1 } else { y } as u64;
    (y, m, d)
}

fn ymd_to_days(y: u64, m: u64, d: u64) -> u64 {
    let y = if m <= 2 { y as i64 - 1 } else { y as i64 };
    let m = if m <= 2 { m + 9 } else { m - 3 };
    let era = if y >= 0 { y } else { y - 399 } / 400;
    let yoe = (y - era * 400) as u64;
    let doy = (153 * m + 2) / 5 + d - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    (era * 146097 + doe as i64 - 719468) as u64
}

fn add_days(date: &str, offset: u64) -> String {
    let parts: Vec<u64> = date.split('-').filter_map(|s| s.parse().ok()).collect();
    if parts.len() != 3 { return date.to_string(); }
    let total = ymd_to_days(parts[0], parts[1], parts[2]) + offset;
    let (y, m, d) = days_to_ymd(total);
    format!("{:04}-{:02}-{:02}", y, m, d)
}

fn weekday_from_date(date: &str) -> u64 {
    let parts: Vec<u64> = date.split('-').filter_map(|s| s.parse().ok()).collect();
    if parts.len() != 3 { return 0; }
    let days = ymd_to_days(parts[0], parts[1], parts[2]);
    (days + 4) % 7 // 0=Sun, 6=Sat
}

fn calculate_tax(subtotal_cents: u32) -> u32 {
    ((subtotal_cents as u64 * TAX_RATE_NUM as u64 + TAX_RATE_DEN as u64 / 2) / TAX_RATE_DEN as u64) as u32
}

// ─────────────────────────────────────────────
// Reducers
// ─────────────────────────────────────────────

#[reducer(init)]
pub fn init(ctx: &ReducerContext) {
    seed_static_data(ctx);
    refresh_time_slots(ctx);
}

#[reducer]
pub fn seed_static_data(ctx: &ReducerContext) {
    // Only seed if provinces table is empty
    if ctx.db.provinces().iter().next().is_some() {
        return;
    }

    // Provinces (with EN/VI names)
    for (id, name, name_en, name_vi, region) in [
        (1u32, "TP Ho Chi Minh", "Ho Chi Minh City", "TP Hồ Chí Minh", "Mien Nam"),
        (2, "Ha Noi", "Hanoi", "Hà Nội", "Mien Bac"),
        (3, "Da Nang", "Da Nang", "Đà Nẵng", "Mien Trung"),
        (4, "Hai Phong", "Hai Phong", "Hải Phòng", "Mien Bac"),
        (5, "Can Tho", "Can Tho", "Cần Thơ", "Mien Nam"),
        (6, "Binh Duong", "Binh Duong", "Bình Dương", "Mien Nam"),
        (7, "Dong Nai", "Dong Nai", "Đồng Nai", "Mien Nam"),
        (8, "Khanh Hoa", "Khanh Hoa", "Khánh Hòa", "Mien Trung"),
    ] {
        ctx.db.provinces().insert(Province {
            id, name: name.into(), name_en: name_en.into(), name_vi: name_vi.into(),
            region: region.into(),
        });
    }

    // Salons (USD prices, EN/VI names/notes)
    let salons: &[(u32, u32, &str, &str, &str, &str, &str, &str, &str, &str, &str, &str, u32, f32, bool, bool, bool, &str, &str)] = &[
        (1, 1, "Super Nails - Riverside Q7",
         "Super Nails - Riverside Q7", "Super Nails - Riverside Q7",
         "Quan 7", "TP Ho Chi Minh", "420 Huynh Tan Phat, P. Binh Thuan", "420 Huynh Tan Phat, Q7",
         "Near Phu My bridge, with parking and signature nail room with river view.",
         "Gần cầu Phú Mỹ, có bãi đỗ ô tô và phòng nail signature view sông.",
         r#"["Midnight gloss","Blue facade","Spa lounge"]"#,
         12, 5.5, true, true, false, "cobalt", ""),
        (2, 1, "Super Nails - Nguyen Thi Thap",
         "Super Nails - Nguyen Thi Thap", "Super Nails - Nguyễn Thị Thập",
         "Quan 7", "TP Ho Chi Minh", "237 Nguyen Thi Thap, P. Tan Phu", "237 Nguyen Thi Thap, Q7",
         "Bright and efficient space, perfect for after-work bookings.",
         "Không gian sáng và nhanh, phù hợp booking sau giờ làm.",
         r#"["Gold bar","Express care","Glass storefront"]"#,
         14, 7.1, true, false, true, "sunrise", ""),
        (3, 1, "Super Nails - Crescent Premium",
         "Super Nails - Crescent Premium", "Super Nails - Crescent Premium",
         "Quan 7", "TP Ho Chi Minh", "408 Nguyen Thi Thap, P. Tan Quy", "408 Nguyen Thi Thap, Q7",
         "Premium lounge with specialized care menu and spacious parking.",
         "Premium lounge, menu chăm sóc chuyên sâu và bãi đỗ xe rộng.",
         r#"["Emerald lounge","Private suite","Art wall"]"#,
         16, 7.5, true, true, true, "emerald", ""),
        (4, 1, "Super Nails - Tran Nao",
         "Super Nails - Tran Nao", "Super Nails - Trần Não",
         "Quan 2", "TP Ho Chi Minh", "103 Tran Nao, P. Binh An", "103 Tran Nao, Quan 2",
         "Near the new center, perfect for skin care and nail art combos.",
         "Chi nhánh gần trung tâm mới, phù hợp combo chăm sóc da và nail art.",
         r#"["Sky blue","Signature room","Soft glow"]"#,
         18, 9.1, false, true, true, "violet", ""),
        (5, 1, "Super Nails - Ton Dan",
         "Super Nails - Ton Dan", "Super Nails - Tôn Đản",
         "Quan 4", "TP Ho Chi Minh", "25 Ton Dan, P. 13", "25 Ton Dan, Quan 4",
         "Quick stop for cuticle clean and gel box lovers.",
         "Điểm hẹn nhanh cho khách yêu thích cuticle clean và gel box.",
         r#"["Rose studio","Glass shelves","Velvet seats"]"#,
         20, 9.7, false, false, true, "rose", ""),
        (6, 3, "Super Nails - Hai Chau",
         "Super Nails - Hai Chau", "Super Nails - Hải Châu",
         "Hai Chau", "Da Nang", "88 Bach Dang, Hai Chau", "88 Bach Dang, Da Nang",
         "Resort-style space, perfect for tourists wanting quick PWA bookings.",
         "Phong cách resort, phù hợp khách du lịch muốn booking nhanh bằng PWA.",
         r#"["Beach light","Clean station","River view"]"#,
         11, 4.2, true, true, true, "sand", ""),
    ];
    for &(id, province_id, name, name_en, name_vi, district, city, street, short_address, note_en, note_vi, gallery_json, travel_minutes, distance_km, nearby, parking, premium, hero_tone, _) in salons {
        ctx.db.salons().insert(Salon {
            id, province_id, name: name.into(), name_en: name_en.into(), name_vi: name_vi.into(),
            district: district.into(), city: city.into(), street: street.into(),
            short_address: short_address.into(),
            note: note_en.into(), note_en: note_en.into(), note_vi: note_vi.into(),
            travel_minutes, distance_km, nearby, parking, premium,
            hero_tone: hero_tone.into(), gallery_json: gallery_json.into(),
        });
    }

    // Stylists (EN/VI titles and specialties)
    let stylists: &[(u32, u32, &str, &str, &str, &str, &str, &str, &str)] = &[
        (1, 1, "Linh", "Master Nail Artist", "Master Nail Artist", "Chuyên gia Nail",
         "Gel ombre and charm stone", "Gel ombre và charm stone", "cobalt"),
        (2, 1, "An", "Senior Stylist", "Senior Stylist", "Stylist Cao cấp",
         "Pedicure spa and French tips", "Pedicure spa và French tips", "sunrise"),
        (3, 1, "Vy", "Signature Artist", "Signature Artist", "Nghệ sĩ Signature",
         "Minimal chrome and cat eye", "Minimal chrome và cat eye", "violet"),
        (4, 2, "Hanh", "Senior Stylist", "Senior Stylist", "Stylist Cao cấp",
         "Quick after-work combos", "Combo nhanh sau giờ làm", "emerald"),
        (5, 2, "My", "Color Specialist", "Color Specialist", "Chuyên gia Màu sắc",
         "Jelly nail dye and seasonal palette", "Nhuộm nail jelly và seasonal palette", "rose"),
        (6, 3, "Nhi", "Premium Artist", "Premium Artist", "Nghệ sĩ Premium",
         "Builder gel and bridal set", "Builder gel và bridal set", "gold"),
        (7, 3, "Tram", "Spa Lead", "Spa Lead", "Trưởng nhóm Spa",
         "Advanced hand and foot care", "Chăm sóc da tay chân chuyên sâu", "emerald"),
        (8, 4, "Thu", "Creative Lead", "Creative Lead", "Trưởng nhóm Sáng tạo",
         "Airbrush and line art", "Airbrush và line art", "violet"),
        (9, 4, "Bao", "Spa Stylist", "Spa Stylist", "Stylist Spa",
         "Head spa and cuticle care", "Head spa và chăm sóc cuticle", "sand"),
        (10, 5, "Khanh", "Signature Artist", "Signature Artist", "Nghệ sĩ Signature",
         "Box short set and nude collection", "Box short set và nude collection", "rose"),
        (11, 6, "Ha", "Resort Stylist", "Resort Stylist", "Stylist Resort",
         "Recovery spa and premium polish", "Recovery spa và premium polish", "sand"),
    ];
    for &(id, salon_id, name, title, title_en, title_vi, specialty_en, specialty_vi, accent) in stylists {
        ctx.db.stylists().insert(Stylist {
            id, salon_id, name: name.into(),
            title: title.into(), title_en: title_en.into(), title_vi: title_vi.into(),
            specialty: specialty_en.into(), specialty_en: specialty_en.into(), specialty_vi: specialty_vi.into(),
            accent: accent.into(),
        });
    }

    // Service categories (EN/VI)
    let categories: &[(u32, &str, &str, &str, &str, &str, &str, &str)] = &[
        (1, "combo-hot", "Hot Combos", "Hot Combos", "Combo mới và hot",
         "Most booked packages this week", "Những gói đang được đặt nhiều trong tuần", ""),
        (2, "nail-basic", "Basic Nails", "Basic Nails", "Nail cơ bản",
         "Cut, gel polish and light design for quick appointments", "Cắt da, sơn gel và design nhẹ cho lịch hẹn nhanh", ""),
        (3, "nail-art", "Nail Art & Premium", "Nail Art & Premium", "Nail art và premium",
         "Builder gel, charms and premium collections", "Builder gel, charm đá và bộ sưu tập đẹp sang", ""),
        (4, "pedicure", "Pedicure & Care", "Pedicure & Care", "Pedicure và chăm sóc",
         "Clean, massage and foot moisturizing", "Làm sạch, massage và dưỡng ẩm chân", ""),
        (5, "spa", "Spa & Relaxation", "Spa & Relaxation", "Spa thư giãn",
         "Hand and foot massage and skin recovery", "Massage tay chân và phục hồi da", ""),
    ];
    for &(id, slug, name, name_en, name_vi, teaser_en, teaser_vi, _) in categories {
        ctx.db.service_categories().insert(ServiceCategory {
            id, slug: slug.into(), name: name.into(),
            name_en: name_en.into(), name_vi: name_vi.into(),
            teaser: teaser_en.into(), teaser_en: teaser_en.into(), teaser_vi: teaser_vi.into(),
        });
    }

    // Services (prices in USD cents)
    let services: &[(u32, u32, &str, &str, &str, &str, &str, u32, u32, Option<&str>, Option<&str>, Option<&str>, &str, &str, &str)] = &[
        (1, 1, "Shine Combo 1", "Shine Combo 1", "Shine Combo 1",
         "Cuticle trim, single-color gel polish and 10-min hand massage.",
         "Cắt da, sơn gel một màu và massage tay 10 phút.",
         45, 3500, Some("Weekend flat rate"), Some("Weekend flat rate"), Some("Đồng giá cuối tuần"), "cobalt",
         "Quick, clean and easy to book", "Nhanh, gọn và dễ đặt lịch"),
        (2, 1, "Shine Combo 2", "Shine Combo 2", "Shine Combo 2",
         "Cuticle trim, gel polish, cuticle care and hand mask.",
         "Cắt da, sơn gel, chăm sóc cuticle và đắp mặt nạ tay.",
         60, 4800, Some("New"), Some("New"), Some("Mới"), "violet",
         "Most booked combo", "Combo được đặt lịch nhiều nhất"),
        (3, 1, "Shine Combo 3", "Shine Combo 3", "Shine Combo 3",
         "Natural builder gel, shoulder massage and light accessories.",
         "Builder gel tự nhiên, massage cổ vai và phụ kiện nhẹ.",
         75, 7200, Some("Premium"), Some("Premium"), Some("Premium"), "emerald",
         "Includes shoulder relaxation", "Đi kèm thư giãn cổ vai gáy"),
        (4, 2, "Express Trim", "Express Trim", "Cắt xả express",
         "Quick cuticle trim, nail conditioning and shine polish.",
         "Cắt da nhanh, dưỡng móng và sơn dưỡng bóng.",
         30, 2200, None, None, None, "sunrise",
         "Perfect for 30-min appointments", "Phù hợp lịch hẹn 30 phút"),
        (5, 2, "Soft French Tip", "Soft French Tip", "French tip soft",
         "Clear gel base and soft curved French tip painting.",
         "Nền gel trong và vẽ French tip tay cong mềm.",
         40, 3800, None, None, None, "cobalt",
         "Classic yet elegant", "Classic nhưng vẫn rất sang"),
        (6, 3, "Cat Eye Galaxy", "Cat Eye Galaxy", "Cat eye galaxy",
         "Multi-layer cat eye gel polish with metallic shimmer effect.",
         "Sơn gel cat eye nhiều lớp và hiệu ứng ánh kim.",
         55, 5500, Some("Hot trend"), Some("Hot trend"), Some("Hot trend"), "violet",
         "Photos beautifully on iPhone", "Lên ảnh đẹp trên iPhone"),
        (7, 3, "Bridal Crystal Set", "Bridal Crystal Set", "Bridal crystal set",
         "Wedding nail set with crystal charms, line art and builder gel.",
         "Bộ nail cưới với charm đá, line art và builder gel.",
         90, 9500, Some("Premium"), Some("Premium"), Some("Premium"), "gold",
         "For your special day", "Dành cho ngày đặc biệt"),
        (8, 4, "Pedicure Refresh", "Pedicure Refresh", "Pedicure refresh",
         "Foot edge cleaning, exfoliation and gel foot polish.",
         "Làm sạch góc chân, tẩy da chết và sơn gel chân.",
         50, 4200, None, None, None, "emerald",
         "Lighter, cleaner feet", "Chân nhẹ và sạch sẽ hơn"),
        (9, 4, "Luxury Spa Pedicure", "Luxury Spa Pedicure", "Luxury spa pedicure",
         "Pedicure with hot stone massage, salt soak and recovery serum.",
         "Pedicure có massage đá nóng, muối ngâm và serum phục hồi.",
         65, 6500, Some("Relaxation"), Some("Relaxation"), Some("Thư giãn"), "sand",
         "Perfect for weekends", "Rất hợp cho cuối tuần"),
        (10, 5, "Hand Recovery Ritual", "Hand Recovery Ritual", "Hand recovery ritual",
         "Exfoliation, massage, serum and paraffin for soft skin.",
         "Tẩy tế bào chết, massage, serum và paraffin mềm da.",
         35, 3800, None, None, None, "rose",
         "Quick moisturizing and recovery", "Dưỡng ẩm và phục hồi nhanh"),
    ];
    for &(id, category_id, name, name_en, name_vi, description_en, description_vi, duration_minutes, price, badge, badge_en, badge_vi, accent, tagline_en, tagline_vi) in services {
        ctx.db.services().insert(Service {
            id, category_id, name: name.into(),
            name_en: name_en.into(), name_vi: name_vi.into(),
            description: description_en.into(),
            description_en: description_en.into(), description_vi: description_vi.into(),
            duration_minutes, price,
            badge: badge.map(String::from),
            badge_en: badge_en.map(String::from), badge_vi: badge_vi.map(String::from),
            accent: accent.into(),
            tagline: tagline_en.into(),
            tagline_en: tagline_en.into(), tagline_vi: tagline_vi.into(),
        });
    }
}

#[reducer]
pub fn refresh_time_slots(ctx: &ReducerContext) {
    let today = epoch_ms_to_vn_date(ctx.timestamp.to_micros_since_unix_epoch() / 1000);

    let salon_ids: Vec<u32> = ctx.db.salons().iter().map(|s| s.id).collect();
    for salon_id in salon_ids {
        for day_offset in 0u64..6 {
            let date = add_days(&today, day_offset);
            let wd = weekday_from_date(&date);
            let weekend = wd == 0 || wd == 6;

            for (slot_index, &time) in TIME_SLOTS.iter().enumerate() {
                // Skip if slot already exists
                let exists = ctx.db.time_slots().iter()
                    .any(|s| s.salon_id == salon_id && s.slot_date == date && s.slot_time == time);
                if exists { continue; }

                let hour: u32 = time.split(':').next().unwrap_or("0").parse().unwrap_or(0);
                let is_peak = weekend || hour >= 18;
                let busy = ((salon_id * 11) + (day_offset as u32 * 5) + slot_index as u32) % 9;
                let is_available = if busy == 0 && hour >= 21 { false } else { busy > 1 };

                ctx.db.time_slots().insert(TimeSlot {
                    id: 0, salon_id, slot_date: date.clone(), slot_time: time.into(),
                    is_peak, is_available,
                });
            }
        }
    }

    // Cleanup past slots
    let to_delete: Vec<u64> = ctx.db.time_slots().iter()
        .filter(|s| s.slot_date < today)
        .map(|s| s.id)
        .collect();
    for slot_id in to_delete {
        ctx.db.time_slots().id().delete(&slot_id);
    }
}

#[reducer]
pub fn create_booking(
    ctx: &ReducerContext,
    salon_id: u32,
    stylist_id: u32,
    appointment_date: String,
    appointment_time: String,
    service_ids: Vec<u32>,
    needs_consultation: bool,
    customer_name: String,
    payment_method: String,
    tip_amount: u32,
) -> Result<(), String> {
    if service_ids.is_empty() && !needs_consultation {
        return Err("Please select at least one service or request a consultation.".into());
    }

    // Validate payment method
    if !["card", "cash", "digital_wallet"].contains(&payment_method.as_str()) {
        return Err("Invalid payment method.".into());
    }

    let today = epoch_ms_to_vn_date(ctx.timestamp.to_micros_since_unix_epoch() / 1000);
    if appointment_date < today {
        return Err("Cannot book for a past date.".into());
    }

    // Validate salon
    if ctx.db.salons().id().find(&salon_id).is_none() {
        return Err("Salon does not exist.".into());
    }

    // Validate stylist belongs to salon
    let stylist_valid = ctx.db.stylists().iter()
        .any(|s| s.id == stylist_id && s.salon_id == salon_id);
    if !stylist_valid {
        return Err("Stylist does not belong to the selected salon.".into());
    }

    // Validate services and sum subtotal (in cents)
    let mut subtotal: u32 = 0;
    for sid in &service_ids {
        match ctx.db.services().id().find(sid) {
            None => return Err(format!("Service id={} does not exist.", sid)),
            Some(s) => subtotal += s.price,
        }
    }

    // Calculate tax
    let tax_amount = calculate_tax(subtotal);
    let total_amount = subtotal + tax_amount + tip_amount;

    // Check slot availability
    let slot = ctx.db.time_slots().iter()
        .find(|s| s.salon_id == salon_id && s.slot_date == appointment_date && s.slot_time == appointment_time);
    match &slot {
        None => return Err("Time slot does not exist.".into()),
        Some(s) if !s.is_available => return Err("Time slot is already booked.".into()),
        _ => {}
    }

    // Mark slot unavailable
    if let Some(s) = slot {
        ctx.db.time_slots().id().update(TimeSlot {
            is_available: false,
            ..s
        });
    }

    // Create booking
    let created_at = format!("{}", ctx.timestamp.to_micros_since_unix_epoch() / 1000);
    let booking = ctx.db.bookings().insert(Booking {
        id: 0,
        salon_id,
        stylist_id,
        appointment_date,
        appointment_time,
        customer_name: if customer_name.is_empty() { "Guest".into() } else { customer_name },
        needs_consultation,
        total_amount,
        tax_amount,
        tip_amount,
        payment_method,
        current_status: "booked".into(),
        created_at: created_at.clone(),
    });

    // Create booking services
    for sid in &service_ids {
        ctx.db.booking_services().insert(BookingService {
            id: 0,
            booking_id: booking.id,
            service_id: *sid,
        });
    }

    // Insert initial booking status
    ctx.db.booking_statuses().insert(BookingStatus {
        id: 0,
        booking_id: booking.id,
        status: "booked".into(),
        changed_at: created_at,
    });

    Ok(())
}

#[reducer]
pub fn update_booking_status(
    ctx: &ReducerContext,
    booking_id: u64,
    new_status: String,
) -> Result<(), String> {
    let booking = ctx.db.bookings().id().find(&booking_id)
        .ok_or("Booking not found.")?;

    // Validate status transition
    let valid_transitions: &[(&str, &str)] = &[
        ("booked", "confirmed"),
        ("confirmed", "in_progress"),
        ("in_progress", "completed"),
        ("completed", "feedback_pending"),
        ("feedback_pending", "feedback_done"),
        ("feedback_done", "shared"),
    ];

    let current = booking.current_status.as_str();
    let is_valid = valid_transitions.iter().any(|(from, to)| *from == current && *to == new_status);
    if !is_valid {
        return Err(format!("Cannot transition from '{}' to '{}'.", current, new_status));
    }

    // Update booking
    ctx.db.bookings().id().update(Booking {
        current_status: new_status.clone(),
        ..booking
    });

    // Insert status record
    let changed_at = format!("{}", ctx.timestamp.to_micros_since_unix_epoch() / 1000);
    ctx.db.booking_statuses().insert(BookingStatus {
        id: 0,
        booking_id,
        status: new_status,
        changed_at,
    });

    Ok(())
}

#[reducer]
pub fn submit_feedback(
    ctx: &ReducerContext,
    booking_id: u64,
    rating: u32,
    comment: String,
) -> Result<(), String> {
    let booking = ctx.db.bookings().id().find(&booking_id)
        .ok_or("Booking not found.")?;

    if rating < 1 || rating > 5 {
        return Err("Rating must be between 1 and 5.".into());
    }

    // Check booking is at feedback_pending or completed state
    let status = booking.current_status.as_str();
    if status != "completed" && status != "feedback_pending" {
        return Err("Booking must be completed before leaving feedback.".into());
    }

    let created_at = format!("{}", ctx.timestamp.to_micros_since_unix_epoch() / 1000);

    ctx.db.feedbacks().insert(Feedback {
        id: 0,
        booking_id,
        rating,
        comment,
        created_at: created_at.clone(),
    });

    // Update status to feedback_done
    ctx.db.bookings().id().update(Booking {
        current_status: "feedback_done".into(),
        ..booking
    });

    ctx.db.booking_statuses().insert(BookingStatus {
        id: 0,
        booking_id,
        status: "feedback_done".into(),
        changed_at: created_at,
    });

    Ok(())
}

#[reducer]
pub fn mark_shared(
    ctx: &ReducerContext,
    booking_id: u64,
) -> Result<(), String> {
    let booking = ctx.db.bookings().id().find(&booking_id)
        .ok_or("Booking not found.")?;

    if booking.current_status != "feedback_done" {
        return Err("Must have submitted feedback before sharing.".into());
    }

    ctx.db.bookings().id().update(Booking {
        current_status: "shared".into(),
        ..booking
    });

    let changed_at = format!("{}", ctx.timestamp.to_micros_since_unix_epoch() / 1000);
    ctx.db.booking_statuses().insert(BookingStatus {
        id: 0,
        booking_id,
        status: "shared".into(),
        changed_at,
    });

    Ok(())
}
