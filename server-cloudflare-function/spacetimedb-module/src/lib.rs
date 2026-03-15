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
    pub region: String,
}

#[table(name = salons, public)]
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
    pub specialty: String,
    pub accent: String,
}

#[table(name = service_categories, public)]
pub struct ServiceCategory {
    #[primary_key]
    #[auto_inc]
    pub id: u32,
    pub slug: String,
    pub name: String,
    pub teaser: String,
}

#[table(name = services, public)]
pub struct Service {
    #[primary_key]
    #[auto_inc]
    pub id: u32,
    pub category_id: u32,
    pub name: String,
    pub description: String,
    pub duration_minutes: u32,
    pub price: u32,
    pub badge: Option<String>,
    pub accent: String,
    pub tagline: String,
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
    pub total_amount: u32,
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

    // Provinces
    for (id, name, region) in [
        (1u32, "TP Ho Chi Minh", "Mien Nam"),
        (2, "Ha Noi", "Mien Bac"),
        (3, "Da Nang", "Mien Trung"),
        (4, "Hai Phong", "Mien Bac"),
        (5, "Can Tho", "Mien Nam"),
        (6, "Binh Duong", "Mien Nam"),
        (7, "Dong Nai", "Mien Nam"),
        (8, "Khanh Hoa", "Mien Trung"),
    ] {
        ctx.db.provinces().insert(Province { id, name: name.into(), region: region.into() });
    }

    // Salons
    let salons: &[(u32, u32, &str, &str, &str, &str, &str, &str, u32, f32, bool, bool, bool, &str, &str)] = &[
        (1, 1, "Super Nails - Riverside Q7", "Quan 7", "TP Ho Chi Minh", "420 Huynh Tan Phat, P. Binh Thuan", "420 Huynh Tan Phat, Q7", "Gan cau Phu My, co bai do oto va phong nail signature view song.", 12, 5.5, true, true, false, "cobalt", r#"["Midnight gloss","Blue facade","Spa lounge"]"#),
        (2, 1, "Super Nails - Nguyen Thi Thap", "Quan 7", "TP Ho Chi Minh", "237 Nguyen Thi Thap, P. Tan Phu", "237 Nguyen Thi Thap, Q7", "Khong gian sang va nhanh, phu hop booking sau gio lam.", 14, 7.1, true, false, true, "sunrise", r#"["Gold bar","Express care","Glass storefront"]"#),
        (3, 1, "Super Nails - Crescent Premium", "Quan 7", "TP Ho Chi Minh", "408 Nguyen Thi Thap, P. Tan Quy", "408 Nguyen Thi Thap, Q7", "Premium lounge, menu cham soc chuyen sau va bai do xe rong.", 16, 7.5, true, true, true, "emerald", r#"["Emerald lounge","Private suite","Art wall"]"#),
        (4, 1, "Super Nails - Tran Nao", "Quan 2", "TP Ho Chi Minh", "103 Tran Nao, P. Binh An", "103 Tran Nao, Quan 2", "Chi nhanh gan trung tam moi, phu hop combo cham soc da va nail art.", 18, 9.1, false, true, true, "violet", r#"["Sky blue","Signature room","Soft glow"]"#),
        (5, 1, "Super Nails - Ton Dan", "Quan 4", "TP Ho Chi Minh", "25 Ton Dan, P. 13", "25 Ton Dan, Quan 4", "Diem hen nhanh cho khach yeu thich caticle clean va gel box.", 20, 9.7, false, false, true, "rose", r#"["Rose studio","Glass shelves","Velvet seats"]"#),
        (6, 3, "Super Nails - Hai Chau", "Hai Chau", "Da Nang", "88 Bach Dang, Hai Chau", "88 Bach Dang, Da Nang", "Phong cach resort, phu hop khach du lich muon booking nhanh bang PWA.", 11, 4.2, true, true, true, "sand", r#"["Beach light","Clean station","River view"]"#),
    ];
    for &(id, province_id, name, district, city, street, short_address, note, travel_minutes, distance_km, nearby, parking, premium, hero_tone, gallery_json) in salons {
        ctx.db.salons().insert(Salon {
            id, province_id, name: name.into(), district: district.into(),
            city: city.into(), street: street.into(), short_address: short_address.into(),
            note: note.into(), travel_minutes, distance_km, nearby, parking, premium,
            hero_tone: hero_tone.into(), gallery_json: gallery_json.into(),
        });
    }

    // Stylists
    for &(id, salon_id, name, title, specialty, accent) in &[
        (1u32, 1u32, "Linh", "Master Nail Artist", "Gel ombre va charm stone", "cobalt"),
        (2, 1, "An", "Senior Stylist", "Pedicure spa va French tips", "sunrise"),
        (3, 1, "Vy", "Signature Artist", "Minimal chrome va cat eye", "violet"),
        (4, 2, "Hanh", "Senior Stylist", "Combo nhanh sau gio lam", "emerald"),
        (5, 2, "My", "Color Specialist", "Nhuom nail jelly va seasonal palette", "rose"),
        (6, 3, "Nhi", "Premium Artist", "Builder gel va bridal set", "gold"),
        (7, 3, "Tram", "Spa Lead", "Cham soc da tay chan chuyen sau", "emerald"),
        (8, 4, "Thu", "Creative Lead", "Airbrush va line art", "violet"),
        (9, 4, "Bao", "Spa Stylist", "Head spa va cham soc cuticle", "sand"),
        (10, 5, "Khanh", "Signature Artist", "Box short set va nude collection", "rose"),
        (11, 6, "Ha", "Resort Stylist", "Recovery spa va premium polish", "sand"),
    ] {
        ctx.db.stylists().insert(Stylist {
            id, salon_id, name: name.into(), title: title.into(),
            specialty: specialty.into(), accent: accent.into(),
        });
    }

    // Service categories
    for &(id, slug, name, teaser) in &[
        (1u32, "combo-moi", "Combo moi va hot", "Nhung goi dang duoc dat nhieu trong tuan"),
        (2, "nail-co-ban", "Nail co ban", "Cat da, son gel va design nhe cho lich hen nhanh"),
        (3, "nail-art", "Nail art va premium", "Builder gel, charm da va bo suu tap dep sang"),
        (4, "pedicure", "Pedicure va cham soc", "Lam sach, massage va duong am chan"),
        (5, "spa", "Spa thu gian", "Massage tay chan va phuc hoi da"),
    ] {
        ctx.db.service_categories().insert(ServiceCategory {
            id, slug: slug.into(), name: name.into(), teaser: teaser.into(),
        });
    }

    // Services
    let services: &[(u32, u32, &str, &str, u32, u32, Option<&str>, &str, &str)] = &[
        (1, 1, "Shine Combo 1", "Cat da, son gel mot mau va massage tay 10 phut.", 45, 122000, Some("Dong gia cuoi tuan"), "cobalt", "Nhanh, gon va de dat lich"),
        (2, 1, "Shine Combo 2", "Cat da, son gel, cham soc cuticle va dap mat na tay.", 60, 205000, Some("Moi"), "violet", "Combo de chot lich nhieu nhat"),
        (3, 1, "Shine Combo 3", "Builder gel tu nhien, massage co vai va phu kien nhe.", 75, 309000, Some("Premium"), "emerald", "Di kem thu gian co vai gay"),
        (4, 2, "Cat xa express", "Cat da nhanh, duong mong va son duong bong.", 30, 97000, None, "sunrise", "Phu hop lich hen 30 phut"),
        (5, 2, "French tip soft", "Nen gel trong va ve French tip tay cong mem.", 40, 149000, None, "cobalt", "Classic nhung van rat sang"),
        (6, 3, "Cat eye galaxy", "Son gel cat eye nhieu lop va hieu ung anh kim.", 55, 229000, Some("Hot trend"), "violet", "Len anh dep tren iPhone"),
        (7, 3, "Bridal crystal set", "Bo nail cuoi voi charm da, line art va builder gel.", 90, 429000, Some("Premium"), "gold", "Danh cho ngay dac biet"),
        (8, 4, "Pedicure refresh", "Lam sach goc chan, tay da chet va son gel chan.", 50, 189000, None, "emerald", "Chan nhe va sach se hon"),
        (9, 4, "Luxury spa pedicure", "Pedicure co massage da nong, muoi ngam va serum phuc hoi.", 65, 259000, Some("Thu gian"), "sand", "Rat hop cho cuoi tuan"),
        (10, 5, "Hand recovery ritual", "Tay te bao chet, massage, serum va paraffin mem da.", 35, 164000, None, "rose", "Duong am va phuc hoi nhanh"),
    ];
    for &(id, category_id, name, description, duration_minutes, price, badge, accent, tagline) in services {
        ctx.db.services().insert(Service {
            id, category_id, name: name.into(), description: description.into(),
            duration_minutes, price, badge: badge.map(String::from),
            accent: accent.into(), tagline: tagline.into(),
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
                // Skip if slot already exists (upsert)
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
) -> Result<(), String> {
    if service_ids.is_empty() && !needs_consultation {
        return Err("Vui long chon it nhat mot dich vu hoac yeu cau tu van.".into());
    }

    let today = epoch_ms_to_vn_date(ctx.timestamp.to_micros_since_unix_epoch() / 1000);
    if appointment_date < today {
        return Err("Khong the dat lich cho ngay da qua.".into());
    }

    // Validate salon
    if ctx.db.salons().id().find(&salon_id).is_none() {
        return Err("Salon khong ton tai.".into());
    }

    // Validate stylist belongs to salon
    let stylist_valid = ctx.db.stylists().iter()
        .any(|s| s.id == stylist_id && s.salon_id == salon_id);
    if !stylist_valid {
        return Err("Stylist khong thuoc salon da chon.".into());
    }

    // Validate services and sum total
    let mut total_amount: u32 = 0;
    for sid in &service_ids {
        match ctx.db.services().id().find(sid) {
            None => return Err(format!("Service id={} khong ton tai.", sid)),
            Some(s) => total_amount += s.price,
        }
    }

    // Check slot availability
    let slot = ctx.db.time_slots().iter()
        .find(|s| s.salon_id == salon_id && s.slot_date == appointment_date && s.slot_time == appointment_time);
    match &slot {
        None => return Err("Khung gio khong ton tai.".into()),
        Some(s) if !s.is_available => return Err("Khung gio da duoc dat.".into()),
        _ => {}
    }

    // Mark slot unavailable
    if let Some(s) = slot {
        let slot_id = s.id;
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
        created_at,
    });

    for sid in &service_ids {
        ctx.db.booking_services().insert(BookingService {
            id: 0,
            booking_id: booking.id,
            service_id: *sid,
        });
    }

    Ok(())
}
