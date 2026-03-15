use spacetimedb::{reducer, table, ReducerContext, Identity, Timestamp, schedule};

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
    pub gallery_json: String, // JSON-serialized Vec<String>
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
    pub price: u32, // VND
    pub badge: Option<String>,
    pub accent: String,
    pub tagline: String,
}

// UNIQUE constraint enforced in create_booking: (salon_id, slot_date, slot_time)
#[table(name = time_slots, public)]
pub struct TimeSlot {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub salon_id: u32,
    pub slot_date: String, // "YYYY-MM-DD" (VN local time)
    pub slot_time: String, // "HH:MM"
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
    pub total_amount: u32, // VND
    pub created_at: String, // ISO 8601
}

#[table(name = booking_services, public)]
pub struct BookingService {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub booking_id: u64,
    pub service_id: u32,
}

#[table(name = slot_schedule, public)]
pub struct SlotSchedule {
    #[primary_key]
    pub id: u32,
    pub scheduled_at: spacetimedb::ScheduleAt,
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

static TIME_SLOTS: &[&str] = &[
    "10:00", "10:20", "10:40", "11:00", "11:20", "11:40",
    "12:00",
    "13:00", "13:20", "13:40", "14:00", "14:20",
    "15:00", "15:20", "15:40", "16:00", "16:20", "16:40",
    "17:00", "17:20", "17:40",
    "18:00", "18:20", "18:40",
    "19:00", "19:20", "19:40",
    "20:00", "20:20", "20:40",
    "21:00", "21:20",
];

/// Return today's date in VN (UTC+7) as "YYYY-MM-DD", given epoch seconds.
fn epoch_secs_to_vn_date(now_secs: u64) -> (String, u32) {
    let vn_secs = now_secs + 7 * 3600;
    let days_since_epoch = vn_secs / 86400;
    // Compute naive ymd from days_since_epoch (Unix epoch = 1970-01-01 = Thursday)
    let (year, month, day) = days_since_epoch_to_ymd(days_since_epoch as u32);
    // weekday: epoch day 0 = Thursday=4; 0=Sun,1=Mon,...6=Sat
    let weekday = ((days_since_epoch + 4) % 7) as u32;
    (format!("{:04}-{:02}-{:02}", year, month, day), weekday)
}

fn days_since_epoch_to_ymd(mut days: u32) -> (u32, u32, u32) {
    // Algorithm from http://howardhinnant.github.io/date_algorithms.html
    let z = days as i64 + 719468;
    let era = if z >= 0 { z } else { z - 146096 } / 146097;
    let doe = (z - era * 146097) as u32;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe as i64 + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = if m <= 2 { y + 1 } else { y } as u32;
    (y, m, d)
}

/// Add `offset_days` to the date "YYYY-MM-DD".
fn add_days_to_date(date: &str, offset: u32) -> (String, u32) {
    // Parse date
    let parts: Vec<u32> = date.split('-').map(|s| s.parse().unwrap_or(0)).collect();
    if parts.len() != 3 { return (date.to_string(), 0); }
    let (y, m, d) = (parts[0], parts[1], parts[2]);
    // Convert to days since epoch, add offset
    let total_days = ymd_to_days_since_epoch(y, m, d) + offset;
    let (ny, nm, nd) = days_since_epoch_to_ymd(total_days);
    let weekday = ((total_days as u64 + 4) % 7) as u32;
    (format!("{:04}-{:02}-{:02}", ny, nm, nd), weekday)
}

fn ymd_to_days_since_epoch(y: u32, m: u32, d: u32) -> u32 {
    // Civil days calculation
    let y = if m <= 2 { y as i64 - 1 } else { y as i64 };
    let m = if m <= 2 { m + 9 } else { m - 3 };
    let era = if y >= 0 { y } else { y - 399 } / 400;
    let yoe = (y - era * 400) as u32;
    let doy = (153 * m + 2) / 5 + d - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    (era * 146097 + doe as i64 - 719468) as u32
}

fn generate_slots_for_date(salon_id: u32, date: &str, weekday: u32, day_offset: u32) {
    let weekend = weekday == 0 || weekday == 6;
    for (slot_index, &time) in TIME_SLOTS.iter().enumerate() {
        // Check if slot already exists (upsert — skip if present)
        let exists = TimeSlot::filter_by_salon_id(&salon_id)
            .find(|s| s.slot_date == date && s.slot_time == time);
        if exists.is_some() {
            continue;
        }
        let hour: u32 = time.split(':').next().unwrap_or("0").parse().unwrap_or(0);
        let is_peak = weekend || hour >= 18;
        // Busy pattern seeded from db.js:
        // (salon_id * 11 + dayOffset * 5 + slotIndex) % 9
        // isAvailable = busyPattern === 0 && hour >= 21 ? 0 : busyPattern > 1 ? 1 : 0
        let busy_pattern = (salon_id * 11 + day_offset * 5 + slot_index as u32) % 9;
        let is_available = if busy_pattern == 0 && hour >= 21 {
            false
        } else {
            busy_pattern > 1
        };
        TimeSlot::insert(TimeSlot {
            id: 0,
            salon_id,
            slot_date: date.to_string(),
            slot_time: time.to_string(),
            is_peak,
            is_available,
        });
    }
}

fn cleanup_past_slots(ctx: &ReducerContext) {
    let now_secs = ctx.timestamp.to_duration_since_unix_epoch().as_secs();
    let (today, _) = epoch_secs_to_vn_date(now_secs);
    let to_delete: Vec<TimeSlot> = TimeSlot::iter()
        .filter(|s| s.slot_date < today)
        .collect();
    for slot in to_delete {
        TimeSlot::delete_by_id(&slot.id);
    }
}

// ─────────────────────────────────────────────
// Reducers
// ─────────────────────────────────────────────

#[reducer(init)]
pub fn init(ctx: &ReducerContext) {
    seed_static_data(ctx);
    refresh_time_slots(ctx);
    // Schedule daily slot refresh
    let scheduled_at = ctx.timestamp + std::time::Duration::from_secs(86400);
    SlotSchedule::insert(SlotSchedule {
        id: 1,
        scheduled_at: scheduled_at.into(),
    });
}

#[reducer]
pub fn seed_static_data(_ctx: &ReducerContext) {
    // Only seed if provinces table is empty
    if Province::iter().next().is_some() {
        return;
    }

    // Provinces
    let provinces = [
        (1u32, "TP Ho Chi Minh", "Mien Nam"),
        (2, "Ha Noi", "Mien Bac"),
        (3, "Da Nang", "Mien Trung"),
        (4, "Hai Phong", "Mien Bac"),
        (5, "Can Tho", "Mien Nam"),
        (6, "Binh Duong", "Mien Nam"),
        (7, "Dong Nai", "Mien Nam"),
        (8, "Khanh Hoa", "Mien Trung"),
    ];
    for (id, name, region) in provinces {
        Province::insert(Province { id, name: name.into(), region: region.into() });
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
    for (id, province_id, name, district, city, street, short_address, note, travel_minutes, distance_km, nearby, parking, premium, hero_tone, gallery_json) in salons {
        Salon::insert(Salon {
            id: *id, province_id: *province_id, name: name.to_string(), district: district.to_string(),
            city: city.to_string(), street: street.to_string(), short_address: short_address.to_string(),
            note: note.to_string(), travel_minutes: *travel_minutes, distance_km: *distance_km,
            nearby: *nearby, parking: *parking, premium: *premium, hero_tone: hero_tone.to_string(),
            gallery_json: gallery_json.to_string(),
        });
    }

    // Stylists
    let stylists: &[(u32, u32, &str, &str, &str, &str)] = &[
        (1, 1, "Linh", "Master Nail Artist", "Gel ombre va charm stone", "cobalt"),
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
    ];
    for (id, salon_id, name, title, specialty, accent) in stylists {
        Stylist::insert(Stylist {
            id: *id, salon_id: *salon_id, name: name.to_string(), title: title.to_string(),
            specialty: specialty.to_string(), accent: accent.to_string(),
        });
    }

    // Service categories
    let categories: &[(u32, &str, &str, &str)] = &[
        (1, "combo-moi", "Combo moi va hot", "Nhung goi dang duoc dat nhieu trong tuan"),
        (2, "nail-co-ban", "Nail co ban", "Cat da, son gel va design nhe cho lich hen nhanh"),
        (3, "nail-art", "Nail art va premium", "Builder gel, charm da va bo suu tap dep sang"),
        (4, "pedicure", "Pedicure va cham soc", "Lam sach, massage va duong am chan"),
        (5, "spa", "Spa thu gian", "Massage tay chan va phuc hoi da"),
    ];
    for (id, slug, name, teaser) in categories {
        ServiceCategory::insert(ServiceCategory {
            id: *id, slug: slug.to_string(), name: name.to_string(), teaser: teaser.to_string(),
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
    for (id, category_id, name, description, duration_minutes, price, badge, accent, tagline) in services {
        Service::insert(Service {
            id: *id, category_id: *category_id, name: name.to_string(), description: description.to_string(),
            duration_minutes: *duration_minutes, price: *price, badge: badge.map(String::from),
            accent: accent.to_string(), tagline: tagline.to_string(),
        });
    }
}

#[reducer]
pub fn refresh_time_slots(ctx: &ReducerContext) {
    let now_secs = ctx.timestamp.to_duration_since_unix_epoch().as_secs();
    let (today, _) = epoch_secs_to_vn_date(now_secs);

    let salon_ids: Vec<u32> = Salon::iter().map(|s| s.id).collect();
    for salon_id in salon_ids {
        for day_offset in 0u32..6 {
            let (date, weekday) = add_days_to_date(&today, day_offset);
            generate_slots_for_date(salon_id, &date, weekday, day_offset);
        }
    }
    cleanup_past_slots(ctx);
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
    // Guard: must have services OR needs_consultation
    if service_ids.is_empty() && !needs_consultation {
        return Err("Vui long chon it nhat mot dich vu hoac yeu cau tu van.".into());
    }

    // Validate past date
    let now_secs = ctx.timestamp.to_duration_since_unix_epoch().as_secs();
    let (today, _) = epoch_secs_to_vn_date(now_secs);
    if appointment_date < today {
        return Err("Khong the dat lich cho ngay da qua.".into());
    }

    // Validate salon exists
    if Salon::filter_by_id(&salon_id).next().is_none() {
        return Err("Salon khong ton tai.".into());
    }

    // Validate stylist belongs to salon
    let stylist = Stylist::filter_by_id(&stylist_id)
        .find(|s| s.salon_id == salon_id);
    if stylist.is_none() {
        return Err("Stylist khong thuoc salon da chon.".into());
    }

    // Validate serviceIds and sum total
    let mut total_amount: u32 = 0;
    for sid in &service_ids {
        match Service::filter_by_id(sid).next() {
            None => return Err(format!("Service id={} khong ton tai.", sid)),
            Some(s) => total_amount += s.price,
        }
    }

    // Validate slot availability (serialized execution prevents race conditions)
    let slot = TimeSlot::filter_by_salon_id(&salon_id)
        .find(|s| s.slot_date == appointment_date && s.slot_time == appointment_time);
    match &slot {
        None => return Err("Khung gio khong ton tai.".into()),
        Some(s) if !s.is_available => return Err("Khung gio da duoc dat.".into()),
        _ => {}
    }

    // Mark slot as unavailable
    if let Some(mut s) = slot {
        s.is_available = false;
        TimeSlot::update_by_id(&s.id.clone(), s);
    }

    // Create booking
    let created_at = format!("{}", ctx.timestamp.to_duration_since_unix_epoch().as_secs());
    let booking = Booking::insert(Booking {
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

    // Insert booking_services
    for sid in &service_ids {
        BookingService::insert(BookingService {
            id: 0,
            booking_id: booking.id,
            service_id: *sid,
        });
    }

    Ok(())
}
