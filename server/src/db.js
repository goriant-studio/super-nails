const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const { runMigrations } = require("./migrate");

const dataDirectory = path.join(__dirname, "..", "data");
const databasePath = path.join(dataDirectory, "super-nails.sqlite");

if (!fs.existsSync(dataDirectory)) {
  fs.mkdirSync(dataDirectory, { recursive: true });
}

const db = new Database(databasePath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function formatLocalDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS provinces (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      region TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS salons (
      id INTEGER PRIMARY KEY,
      province_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      district TEXT NOT NULL,
      city TEXT NOT NULL,
      street TEXT NOT NULL,
      short_address TEXT NOT NULL,
      note TEXT NOT NULL,
      travel_minutes INTEGER NOT NULL,
      distance_km REAL NOT NULL,
      nearby INTEGER NOT NULL DEFAULT 0,
      parking INTEGER NOT NULL DEFAULT 0,
      premium INTEGER NOT NULL DEFAULT 0,
      hero_tone TEXT NOT NULL,
      gallery_json TEXT NOT NULL,
      FOREIGN KEY (province_id) REFERENCES provinces(id)
    );

    CREATE TABLE IF NOT EXISTS stylists (
      id INTEGER PRIMARY KEY,
      salon_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      title TEXT NOT NULL,
      specialty TEXT NOT NULL,
      accent TEXT NOT NULL,
      FOREIGN KEY (salon_id) REFERENCES salons(id)
    );

    CREATE TABLE IF NOT EXISTS service_categories (
      id INTEGER PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      teaser TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      price INTEGER NOT NULL,
      badge TEXT,
      accent TEXT NOT NULL,
      tagline TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES service_categories(id)
    );

    CREATE TABLE IF NOT EXISTS time_slots (
      id INTEGER PRIMARY KEY,
      salon_id INTEGER NOT NULL,
      slot_date TEXT NOT NULL,
      slot_time TEXT NOT NULL,
      is_peak INTEGER NOT NULL DEFAULT 0,
      is_available INTEGER NOT NULL DEFAULT 1,
      UNIQUE (salon_id, slot_date, slot_time),
      FOREIGN KEY (salon_id) REFERENCES salons(id)
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY,
      salon_id INTEGER NOT NULL,
      stylist_id INTEGER NOT NULL,
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      customer_name TEXT NOT NULL DEFAULT 'Guest',
      needs_consultation INTEGER NOT NULL DEFAULT 0,
      total_amount INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (salon_id) REFERENCES salons(id),
      FOREIGN KEY (stylist_id) REFERENCES stylists(id)
    );

    CREATE TABLE IF NOT EXISTS booking_services (
      id INTEGER PRIMARY KEY,
      booking_id INTEGER NOT NULL,
      service_id INTEGER NOT NULL,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      FOREIGN KEY (service_id) REFERENCES services(id)
    );
  `);
}

function seedStaticData() {
  const provinceCount = db.prepare("SELECT COUNT(*) AS count FROM provinces").get().count;

  if (provinceCount > 0) {
    // Update i18n fields for existing data
    updateI18nFields();
    return;
  }

  const provinces = [
    [1, "TP. Hồ Chí Minh", "Miền Nam"],
    [2, "Hà Nội", "Miền Bắc"],
    [3, "Đà Nẵng", "Miền Trung"],
    [4, "Hải Phòng", "Miền Bắc"],
    [5, "Cần Thơ", "Miền Nam"],
    [6, "Bình Dương", "Miền Nam"],
    [7, "Đồng Nai", "Miền Nam"],
    [8, "Khánh Hòa", "Miền Trung"]
  ];

  const salons = [
    [
      1, 1, "Super Nails - Riverside Q7",
      "Quận 7", "TP. Hồ Chí Minh",
      "420 Huỳnh Tấn Phát, P. Bình Thuận",
      "420 Huỳnh Tấn Phát, Q7",
      "Gần cầu Phú Mỹ, có bãi đỗ ô tô và phòng nail signature view sông.",
      12, 5.5, 1, 1, 0, "cobalt",
      JSON.stringify(["Midnight gloss", "Blue facade", "Spa lounge"])
    ],
    [
      2, 1, "Super Nails - Nguyễn Thị Thập",
      "Quận 7", "TP. Hồ Chí Minh",
      "237 Nguyễn Thị Thập, P. Tân Phú",
      "237 Nguyễn Thị Thập, Q7",
      "Không gian sáng và nhanh, phù hợp booking sau giờ làm.",
      14, 7.1, 1, 0, 1, "sunrise",
      JSON.stringify(["Gold bar", "Express care", "Glass storefront"])
    ],
    [
      3, 1, "Super Nails - Crescent Premium",
      "Quận 7", "TP. Hồ Chí Minh",
      "408 Nguyễn Thị Thập, P. Tân Quy",
      "408 Nguyễn Thị Thập, Q7",
      "Premium lounge, menu chăm sóc chuyên sâu và bãi đỗ xe rộng.",
      16, 7.5, 1, 1, 1, "emerald",
      JSON.stringify(["Emerald lounge", "Private suite", "Art wall"])
    ],
    [
      4, 1, "Super Nails - Trần Não",
      "Quận 2", "TP. Hồ Chí Minh",
      "103 Trần Não, P. Bình An",
      "103 Trần Não, Quận 2",
      "Chi nhánh gần trung tâm mới, phù hợp combo chăm sóc da và nail art.",
      18, 9.1, 0, 1, 1, "violet",
      JSON.stringify(["Sky blue", "Signature room", "Soft glow"])
    ],
    [
      5, 1, "Super Nails - Tôn Đản",
      "Quận 4", "TP. Hồ Chí Minh",
      "25 Tôn Đản, P. 13",
      "25 Tôn Đản, Quận 4",
      "Điểm hẹn nhanh cho khách yêu thích cuticle clean và gel box.",
      20, 9.7, 0, 0, 1, "rose",
      JSON.stringify(["Rose studio", "Glass shelves", "Velvet seats"])
    ],
    [
      6, 3, "Super Nails - Hải Châu",
      "Hải Châu", "Đà Nẵng",
      "88 Bạch Đằng, Hải Châu",
      "88 Bạch Đằng, Đà Nẵng",
      "Phong cách resort, phù hợp khách du lịch muốn booking nhanh bằng PWA.",
      11, 4.2, 1, 1, 1, "sand",
      JSON.stringify(["Beach light", "Clean station", "River view"])
    ]
  ];

  const stylists = [
    [1, 1, "Linh", "Nghệ nhân Nail", "Gel ombré và charm đá", "cobalt"],
    [2, 1, "An", "Stylist Cao cấp", "Pedicure spa và French tips", "sunrise"],
    [3, 1, "Vy", "Nghệ nhân Signature", "Minimal chrome và cat eye", "violet"],
    [4, 2, "Hạnh", "Stylist Cao cấp", "Combo nhanh sau giờ làm", "emerald"],
    [5, 2, "My", "Chuyên gia Màu sắc", "Nhuộm nail jelly và seasonal palette", "rose"],
    [6, 3, "Nhi", "Nghệ nhân Premium", "Builder gel và bridal set", "gold"],
    [7, 3, "Trâm", "Trưởng nhóm Spa", "Chăm sóc da tay chân chuyên sâu", "emerald"],
    [8, 4, "Thu", "Trưởng nhóm Sáng tạo", "Airbrush và line art", "violet"],
    [9, 4, "Bảo", "Stylist Spa", "Head spa và chăm sóc cuticle", "sand"],
    [10, 5, "Khánh", "Nghệ nhân Signature", "Box short set và nude collection", "rose"],
    [11, 6, "Hà", "Stylist Resort", "Recovery spa và premium polish", "sand"]
  ];

  const categories = [
    [1, "combo-moi", "Combo mới và hot", "Những gói đang được đặt nhiều trong tuần"],
    [2, "nail-co-ban", "Nail cơ bản", "Cắt da, sơn gel và design nhẹ cho lịch hẹn nhanh"],
    [3, "nail-art", "Nail art và premium", "Builder gel, charm đá và bộ sưu tập đẹp sang"],
    [4, "pedicure", "Pedicure và chăm sóc", "Làm sạch, massage và dưỡng ẩm chân"],
    [5, "spa", "Spa thư giãn", "Massage tay chân và phục hồi da"]
  ];

  const services = [
    [1, 1, "Shine Combo 1", "Cắt da, sơn gel một màu và massage tay 10 phút.", 45, 2500, "Đồng giá cuối tuần", "cobalt", "Nhanh, gọn và dễ đặt lịch"],
    [2, 1, "Shine Combo 2", "Cắt da, sơn gel, chăm sóc cuticle và đắp mặt nạ tay.", 60, 4000, "Mới", "violet", "Combo dễ chốt lịch nhiều nhất"],
    [3, 1, "Shine Combo 3", "Builder gel tự nhiên, massage cổ vai và phụ kiện nhẹ.", 75, 5500, "Premium", "emerald", "Đi kèm thư giãn cổ vai gáy"],
    [4, 2, "Cắt xả express", "Cắt da nhanh, dưỡng móng và sơn dưỡng bóng.", 30, 1800, null, "sunrise", "Phù hợp lịch hẹn 30 phút"],
    [5, 2, "French tip soft", "Nền gel trong và vẽ French tip tay cong mềm.", 40, 3000, null, "cobalt", "Classic nhưng vẫn rất sang"],
    [6, 3, "Cat eye galaxy", "Sơn gel cat eye nhiều lớp và hiệu ứng ánh kim.", 55, 3500, "Hot trend", "violet", "Lên ảnh đẹp trên iPhone"],
    [7, 3, "Bridal crystal set", "Bộ nail cưới với charm đá, line art và builder gel.", 90, 7500, "Premium", "gold", "Dành cho ngày đặc biệt"],
    [8, 4, "Pedicure refresh", "Làm sạch góc chân, tẩy da chết và sơn gel chân.", 50, 3200, null, "emerald", "Chân nhẹ và sạch sẽ hơn"],
    [9, 4, "Luxury spa pedicure", "Pedicure có massage đá nóng, muối ngâm và serum phục hồi.", 65, 4800, "Thư giãn", "sand", "Rất hợp cho cuối tuần"],
    [10, 5, "Hand recovery ritual", "Tẩy tế bào chết, massage, serum và paraffin mềm da.", 35, 2800, null, "rose", "Dưỡng ẩm và phục hồi nhanh"]
  ];

  const insertProvince = db.prepare(
    "INSERT INTO provinces (id, name, region) VALUES (?, ?, ?)"
  );
  const insertSalon = db.prepare(
    `INSERT INTO salons (
      id, province_id, name, district, city, street, short_address, note,
      travel_minutes, distance_km, nearby, parking, premium, hero_tone, gallery_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertStylist = db.prepare(
    "INSERT INTO stylists (id, salon_id, name, title, specialty, accent) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const insertCategory = db.prepare(
    "INSERT INTO service_categories (id, slug, name, teaser) VALUES (?, ?, ?, ?)"
  );
  const insertService = db.prepare(
    `INSERT INTO services (
      id, category_id, name, description, duration_minutes, price, badge, accent, tagline
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const seedTransaction = db.transaction(() => {
    provinces.forEach((row) => insertProvince.run(...row));
    salons.forEach((row) => insertSalon.run(...row));
    stylists.forEach((row) => insertStylist.run(...row));
    categories.forEach((row) => insertCategory.run(...row));
    services.forEach((row) => insertService.run(...row));
  });

  seedTransaction();

  // Populate i18n fields after seeding
  updateI18nFields();
}

/** Populate i18n columns with bilingual content. */
function updateI18nFields() {
  // Check if i18n columns exist (migration 001 applied)
  try {
    db.prepare("SELECT name_en FROM provinces LIMIT 1").get();
  } catch {
    return; // i18n columns not yet added
  }

  const provinceI18n = {
    1: { en: "Ho Chi Minh City", vi: "TP. Hồ Chí Minh" },
    2: { en: "Ha Noi", vi: "Hà Nội" },
    3: { en: "Da Nang", vi: "Đà Nẵng" },
    4: { en: "Hai Phong", vi: "Hải Phòng" },
    5: { en: "Can Tho", vi: "Cần Thơ" },
    6: { en: "Binh Duong", vi: "Bình Dương" },
    7: { en: "Dong Nai", vi: "Đồng Nai" },
    8: { en: "Khanh Hoa", vi: "Khánh Hòa" },
  };

  const salonI18n = {
    1: {
      nameEn: "Super Nails - Riverside Q7",
      nameVi: "Super Nails - Riverside Q7",
      noteEn: "Near Phu My Bridge. Car parking and signature nail room with river view.",
      noteVi: "Gần cầu Phú Mỹ, có bãi đỗ ô tô và phòng nail signature view sông.",
    },
    2: {
      nameEn: "Super Nails - Nguyen Thi Thap",
      nameVi: "Super Nails - Nguyễn Thị Thập",
      noteEn: "Bright and fast space, perfect for after-work bookings.",
      noteVi: "Không gian sáng và nhanh, phù hợp booking sau giờ làm.",
    },
    3: {
      nameEn: "Super Nails - Crescent Premium",
      nameVi: "Super Nails - Crescent Premium",
      noteEn: "Premium lounge with specialized care menu and spacious parking.",
      noteVi: "Premium lounge, menu chăm sóc chuyên sâu và bãi đỗ xe rộng.",
    },
    4: {
      nameEn: "Super Nails - Tran Nao",
      nameVi: "Super Nails - Trần Não",
      noteEn: "Branch near the new center, perfect for skincare and nail art combos.",
      noteVi: "Chi nhánh gần trung tâm mới, phù hợp combo chăm sóc da và nail art.",
    },
    5: {
      nameEn: "Super Nails - Ton Dan",
      nameVi: "Super Nails - Tôn Đản",
      noteEn: "Quick appointment spot for cuticle care and gel box lovers.",
      noteVi: "Điểm hẹn nhanh cho khách yêu thích cuticle clean và gel box.",
    },
    6: {
      nameEn: "Super Nails - Hai Chau",
      nameVi: "Super Nails - Hải Châu",
      noteEn: "Resort style, perfect for tourists who want quick PWA booking.",
      noteVi: "Phong cách resort, phù hợp khách du lịch muốn booking nhanh bằng PWA.",
    },
  };

  const stylistI18n = {
    1: { titleEn: "Master Nail Artist", titleVi: "Nghệ nhân Nail", specialtyEn: "Gel ombré and charm stones", specialtyVi: "Gel ombré và charm đá" },
    2: { titleEn: "Senior Stylist", titleVi: "Stylist Cao cấp", specialtyEn: "Pedicure spa and French tips", specialtyVi: "Pedicure spa và French tips" },
    3: { titleEn: "Signature Artist", titleVi: "Nghệ nhân Signature", specialtyEn: "Minimal chrome and cat eye", specialtyVi: "Minimal chrome và cat eye" },
    4: { titleEn: "Senior Stylist", titleVi: "Stylist Cao cấp", specialtyEn: "Quick after-work combos", specialtyVi: "Combo nhanh sau giờ làm" },
    5: { titleEn: "Color Specialist", titleVi: "Chuyên gia Màu sắc", specialtyEn: "Jelly nail dye and seasonal palette", specialtyVi: "Nhuộm nail jelly và seasonal palette" },
    6: { titleEn: "Premium Artist", titleVi: "Nghệ nhân Premium", specialtyEn: "Builder gel and bridal sets", specialtyVi: "Builder gel và bridal set" },
    7: { titleEn: "Spa Lead", titleVi: "Trưởng nhóm Spa", specialtyEn: "Deep hand and foot care", specialtyVi: "Chăm sóc da tay chân chuyên sâu" },
    8: { titleEn: "Creative Lead", titleVi: "Trưởng nhóm Sáng tạo", specialtyEn: "Airbrush and line art", specialtyVi: "Airbrush và line art" },
    9: { titleEn: "Spa Stylist", titleVi: "Stylist Spa", specialtyEn: "Head spa and cuticle care", specialtyVi: "Head spa và chăm sóc cuticle" },
    10: { titleEn: "Signature Artist", titleVi: "Nghệ nhân Signature", specialtyEn: "Short box set and nude collection", specialtyVi: "Box short set và nude collection" },
    11: { titleEn: "Resort Stylist", titleVi: "Stylist Resort", specialtyEn: "Recovery spa and premium polish", specialtyVi: "Recovery spa và premium polish" },
  };

  const categoryI18n = {
    1: { nameEn: "New & Hot Combos", nameVi: "Combo mới và hot", teaserEn: "Most booked packages this week", teaserVi: "Những gói đang được đặt nhiều trong tuần" },
    2: { nameEn: "Basic Nails", nameVi: "Nail cơ bản", teaserEn: "Cuticle trim, gel polish, and light design for quick appointments", teaserVi: "Cắt da, sơn gel và design nhẹ cho lịch hẹn nhanh" },
    3: { nameEn: "Nail Art & Premium", nameVi: "Nail art và premium", teaserEn: "Builder gel, charm stones, and beautiful collections", teaserVi: "Builder gel, charm đá và bộ sưu tập đẹp sang" },
    4: { nameEn: "Pedicure & Care", nameVi: "Pedicure và chăm sóc", teaserEn: "Cleansing, massage, and foot moisturizing", teaserVi: "Làm sạch, massage và dưỡng ẩm chân" },
    5: { nameEn: "Relaxation Spa", nameVi: "Spa thư giãn", teaserEn: "Hand and foot massage and skin recovery", teaserVi: "Massage tay chân và phục hồi da" },
  };

  const serviceI18n = {
    1: {
      nameEn: "Shine Combo 1", nameVi: "Shine Combo 1",
      descEn: "Cuticle trim, single-color gel polish, and 10-minute hand massage.",
      descVi: "Cắt da, sơn gel một màu và massage tay 10 phút.",
      badgeEn: "Weekend flat rate", badgeVi: "Đồng giá cuối tuần",
      tagEn: "Quick, neat and easy to book", tagVi: "Nhanh, gọn và dễ đặt lịch",
    },
    2: {
      nameEn: "Shine Combo 2", nameVi: "Shine Combo 2",
      descEn: "Cuticle trim, gel polish, cuticle care, and hand mask.",
      descVi: "Cắt da, sơn gel, chăm sóc cuticle và đắp mặt nạ tay.",
      badgeEn: "New", badgeVi: "Mới",
      tagEn: "Most booked combo", tagVi: "Combo dễ chốt lịch nhiều nhất",
    },
    3: {
      nameEn: "Shine Combo 3", nameVi: "Shine Combo 3",
      descEn: "Natural builder gel, shoulder massage, and light accessories.",
      descVi: "Builder gel tự nhiên, massage cổ vai và phụ kiện nhẹ.",
      badgeEn: "Premium", badgeVi: "Premium",
      tagEn: "Includes shoulder relaxation", tagVi: "Đi kèm thư giãn cổ vai gáy",
    },
    4: {
      nameEn: "Express Trim", nameVi: "Cắt xả express",
      descEn: "Quick cuticle trim, nail nourishing, and shine coat.",
      descVi: "Cắt da nhanh, dưỡng móng và sơn dưỡng bóng.",
      badgeEn: null, badgeVi: null,
      tagEn: "Perfect for a 30-minute appointment", tagVi: "Phù hợp lịch hẹn 30 phút",
    },
    5: {
      nameEn: "Soft French Tips", nameVi: "French tip soft",
      descEn: "Clear gel base and soft curved French tip painting.",
      descVi: "Nền gel trong và vẽ French tip tay cong mềm.",
      badgeEn: null, badgeVi: null,
      tagEn: "Classic yet elegant", tagVi: "Classic nhưng vẫn rất sang",
    },
    6: {
      nameEn: "Cat Eye Galaxy", nameVi: "Cat eye galaxy",
      descEn: "Multi-layer cat eye gel polish with metallic shimmer effect.",
      descVi: "Sơn gel cat eye nhiều lớp và hiệu ứng ánh kim.",
      badgeEn: "Hot trend", badgeVi: "Hot trend",
      tagEn: "Photos beautifully on iPhone", tagVi: "Lên ảnh đẹp trên iPhone",
    },
    7: {
      nameEn: "Bridal Crystal Set", nameVi: "Bridal crystal set",
      descEn: "Wedding nail set with crystal charms, line art, and builder gel.",
      descVi: "Bộ nail cưới với charm đá, line art và builder gel.",
      badgeEn: "Premium", badgeVi: "Premium",
      tagEn: "For your special day", tagVi: "Dành cho ngày đặc biệt",
    },
    8: {
      nameEn: "Pedicure Refresh", nameVi: "Pedicure refresh",
      descEn: "Foot corner cleaning, dead skin removal, and gel foot polish.",
      descVi: "Làm sạch góc chân, tẩy da chết và sơn gel chân.",
      badgeEn: null, badgeVi: null,
      tagEn: "Lighter and cleaner feet", tagVi: "Chân nhẹ và sạch sẽ hơn",
    },
    9: {
      nameEn: "Luxury Spa Pedicure", nameVi: "Luxury spa pedicure",
      descEn: "Pedicure with hot stone massage, salt soak, and recovery serum.",
      descVi: "Pedicure có massage đá nóng, muối ngâm và serum phục hồi.",
      badgeEn: "Relaxation", badgeVi: "Thư giãn",
      tagEn: "Perfect for weekends", tagVi: "Rất hợp cho cuối tuần",
    },
    10: {
      nameEn: "Hand Recovery Ritual", nameVi: "Hand recovery ritual",
      descEn: "Exfoliation, massage, serum, and paraffin for soft skin.",
      descVi: "Tẩy tế bào chết, massage, serum và paraffin mềm da.",
      badgeEn: null, badgeVi: null,
      tagEn: "Moisturize and recover quickly", tagVi: "Dưỡng ẩm và phục hồi nhanh",
    },
  };

  const updateProvince = db.prepare("UPDATE provinces SET name_en = ?, name_vi = ? WHERE id = ?");
  const updateSalon = db.prepare("UPDATE salons SET name_en = ?, name_vi = ?, note_en = ?, note_vi = ? WHERE id = ?");
  const updateStylist = db.prepare("UPDATE stylists SET title_en = ?, title_vi = ?, specialty_en = ?, specialty_vi = ? WHERE id = ?");
  const updateCategory = db.prepare("UPDATE service_categories SET name_en = ?, name_vi = ?, teaser_en = ?, teaser_vi = ? WHERE id = ?");
  const updateService = db.prepare("UPDATE services SET name_en = ?, name_vi = ?, description_en = ?, description_vi = ?, badge_en = ?, badge_vi = ?, tagline_en = ?, tagline_vi = ? WHERE id = ?");

  db.transaction(() => {
    for (const [id, data] of Object.entries(provinceI18n)) {
      updateProvince.run(data.en, data.vi, Number(id));
    }
    for (const [id, data] of Object.entries(salonI18n)) {
      updateSalon.run(data.nameEn, data.nameVi, data.noteEn, data.noteVi, Number(id));
    }
    for (const [id, data] of Object.entries(stylistI18n)) {
      updateStylist.run(data.titleEn, data.titleVi, data.specialtyEn, data.specialtyVi, Number(id));
    }
    for (const [id, data] of Object.entries(categoryI18n)) {
      updateCategory.run(data.nameEn, data.nameVi, data.teaserEn, data.teaserVi, Number(id));
    }
    for (const [id, data] of Object.entries(serviceI18n)) {
      updateService.run(data.nameEn, data.nameVi, data.descEn, data.descVi, data.badgeEn, data.badgeVi, data.tagEn, data.tagVi, Number(id));
    }
  })();
}

function buildSlotRows() {
  const salons = db.prepare("SELECT id FROM salons ORDER BY id").all();
  const rows = [];
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const times = [
    "10:00", "10:20", "10:40", "11:00", "11:20", "11:40",
    "12:00", "13:00", "13:20", "13:40", "14:00", "14:20",
    "15:00", "15:20", "15:40", "16:00", "16:20", "16:40",
    "17:00", "17:20", "17:40", "18:00", "18:20", "18:40",
    "19:00", "19:20", "19:40", "20:00", "20:20", "20:40",
    "21:00", "21:20"
  ];

  salons.forEach((salon) => {
    for (let dayOffset = 0; dayOffset < 6; dayOffset += 1) {
      const date = new Date(startOfToday);
      date.setDate(startOfToday.getDate() + dayOffset);
      const isoDate = formatLocalDateKey(date);
      const dayNumber = date.getDay();
      const weekend = dayNumber === 0 || dayNumber === 6;

      times.forEach((time, index) => {
        const hour = Number(time.split(":")[0]);
        const isPeak = weekend || hour >= 18 ? 1 : 0;
        // All slots start available — bookings mark them unavailable
        const isAvailable = 1;

        rows.push([salon.id, isoDate, time, isPeak, isAvailable]);
      });
    }
  });

  return rows;
}

function refreshTimeSlots() {
  // #5: Only regenerate if today's slots are missing
  const todayKey = formatLocalDateKey(new Date());
  const existingCount = db.prepare(
    "SELECT COUNT(*) AS count FROM time_slots WHERE slot_date = ?"
  ).get(todayKey).count;
  if (existingCount > 0) return; // slots already fresh

  const slotRows = buildSlotRows();
  const deleteSlots = db.prepare("DELETE FROM time_slots");
  const insertSlot = db.prepare(
    "INSERT INTO time_slots (salon_id, slot_date, slot_time, is_peak, is_available) VALUES (?, ?, ?, ?, ?)"
  );
  const bookedSlots = db
    .prepare("SELECT salon_id, appointment_date, appointment_time FROM bookings WHERE status != 'cancelled'")
    .all();

  const tx = db.transaction(() => {
    deleteSlots.run();
    slotRows.forEach((row) => insertSlot.run(...row));
    bookedSlots.forEach((booking) => {
      db.prepare(
        `UPDATE time_slots
         SET is_available = 0
         WHERE salon_id = ? AND slot_date = ? AND slot_time = ?`
      ).run(booking.salon_id, booking.appointment_date, booking.appointment_time);
    });
  });

  tx();
}

// #1: Targeted slots query instead of loading entire DB
function getSlots(salonId, date) {
  return db.prepare(
    `SELECT * FROM time_slots WHERE salon_id = ? AND slot_date = ?`
  ).all(salonId, date).map(slot => ({
    id: slot.id,
    salonId: slot.salon_id,
    date: slot.slot_date,
    time: slot.slot_time,
    isPeak: Boolean(slot.is_peak),
    isAvailable: Boolean(slot.is_available),
  }));
}

function initializeDatabase() {
  createTables();
  runMigrations(db);
  seedStaticData();
  refreshTimeSlots();
}

function rowsToBootstrap() {
  const provinces = db.prepare("SELECT * FROM provinces ORDER BY name").all().map((p) => ({
    id: p.id,
    name: p.name,
    nameEn: p.name_en || p.name,
    nameVi: p.name_vi || p.name,
    region: p.region,
  }));

  const salons = db
    .prepare(
      `SELECT salons.*, provinces.name AS province_name
       FROM salons
       JOIN provinces ON provinces.id = salons.province_id
       ORDER BY nearby DESC, premium DESC, distance_km ASC`
    )
    .all()
    .map((salon) => ({
      id: salon.id,
      provinceId: salon.province_id,
      provinceName: salon.province_name,
      name: salon.name,
      nameEn: salon.name_en || salon.name,
      nameVi: salon.name_vi || salon.name,
      district: salon.district,
      city: salon.city,
      street: salon.street,
      shortAddress: salon.short_address,
      note: salon.note,
      noteEn: salon.note_en || salon.note,
      noteVi: salon.note_vi || salon.note,
      travelMinutes: salon.travel_minutes,
      distanceKm: salon.distance_km,
      nearby: Boolean(salon.nearby),
      parking: Boolean(salon.parking),
      premium: Boolean(salon.premium),
      heroTone: salon.hero_tone,
      gallery: JSON.parse(salon.gallery_json)
    }));

  const stylists = db
    .prepare("SELECT * FROM stylists ORDER BY salon_id, id")
    .all()
    .map((stylist) => ({
      id: stylist.id,
      salonId: stylist.salon_id,
      name: stylist.name,
      title: stylist.title,
      titleEn: stylist.title_en || stylist.title,
      titleVi: stylist.title_vi || stylist.title,
      specialty: stylist.specialty,
      specialtyEn: stylist.specialty_en || stylist.specialty,
      specialtyVi: stylist.specialty_vi || stylist.specialty,
      accent: stylist.accent
    }));

  const categories = db
    .prepare("SELECT * FROM service_categories ORDER BY id")
    .all()
    .map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
      nameEn: category.name_en || category.name,
      nameVi: category.name_vi || category.name,
      teaser: category.teaser,
      teaserEn: category.teaser_en || category.teaser,
      teaserVi: category.teaser_vi || category.teaser,
    }));

  const services = db
    .prepare("SELECT * FROM services ORDER BY id")
    .all()
    .map((service) => ({
      id: service.id,
      categoryId: service.category_id,
      name: service.name,
      nameEn: service.name_en || service.name,
      nameVi: service.name_vi || service.name,
      description: service.description,
      descriptionEn: service.description_en || service.description,
      descriptionVi: service.description_vi || service.description,
      durationMinutes: service.duration_minutes,
      price: service.price,
      badge: service.badge,
      badgeEn: service.badge_en !== undefined ? service.badge_en : service.badge,
      badgeVi: service.badge_vi !== undefined ? service.badge_vi : service.badge,
      accent: service.accent,
      tagline: service.tagline,
      taglineEn: service.tagline_en || service.tagline,
      taglineVi: service.tagline_vi || service.tagline,
    }));

  const timeSlots = db
    .prepare("SELECT * FROM time_slots ORDER BY salon_id, slot_date, slot_time")
    .all()
    .map((slot) => ({
      id: slot.id,
      salonId: slot.salon_id,
      date: slot.slot_date,
      time: slot.slot_time,
      isPeak: Boolean(slot.is_peak),
      isAvailable: Boolean(slot.is_available)
    }));

  return {
    generatedAt: new Date().toISOString(),
    provinces,
    salons,
    stylists,
    categories,
    services,
    timeSlots
  };
}

function createBooking(payload) {
  const {
    salonId,
    stylistId,
    appointmentDate,
    appointmentTime,
    serviceIds,
    needsConsultation = false,
    customerName = "Guest",
    paymentMethod = "card",
    tipAmount = 0,
  } = payload;

  if (!salonId || !stylistId || !appointmentDate || !appointmentTime || !Array.isArray(serviceIds)) {
    throw new Error("Thiếu thông tin đặt lịch.");
  }

  if (serviceIds.length === 0 && !needsConsultation) {
    throw new Error("Vui lòng chọn ít nhất một dịch vụ hoặc yêu cầu tư vấn.");
  }

  // Validate salonId exists
  const salon = db.prepare("SELECT id FROM salons WHERE id = ?").get(salonId);
  if (!salon) {
    throw new Error("Salon không tồn tại.");
  }

  // Validate stylistId belongs to salonId
  const stylist = db
    .prepare("SELECT id FROM stylists WHERE id = ? AND salon_id = ?")
    .get(stylistId, salonId);
  if (!stylist) {
    throw new Error("Stylist không thuộc salon đã chọn.");
  }

  // #4: Validate all serviceIds exist (single query, reused below for price)
  const services = serviceIds.length
    ? db
        .prepare(
          `SELECT id, price
           FROM services
           WHERE id IN (${serviceIds.map(() => "?").join(",")})`
        )
        .all(...serviceIds)
    : [];

  if (serviceIds.length && services.length !== serviceIds.length) {
    throw new Error("Một số dịch vụ không hợp lệ.");
  }

  // #3: totalAmount = subtotal + tip
  const subtotal = services.reduce((sum, service) => sum + service.price, 0);
  const totalAmount = subtotal + tipAmount;
  const timestamp = new Date().toISOString();

  const transaction = db.transaction(() => {
    // #2: Atomic slot claim — UPDATE with is_available = 1 guard
    const slotResult = db.prepare(
      `UPDATE time_slots SET is_available = 0
       WHERE salon_id = ? AND slot_date = ? AND slot_time = ? AND is_available = 1`
    ).run(salonId, appointmentDate, appointmentTime);

    if (slotResult.changes === 0) {
      throw Object.assign(
        new Error("Khung giờ này không còn trống."),
        { code: "SLOT_UNAVAILABLE" }
      );
    }

    const bookingResult = db
      .prepare(
        `INSERT INTO bookings (
          salon_id, stylist_id, appointment_date, appointment_time,
          customer_name, needs_consultation, total_amount, created_at,
          status, payment_method, tip_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'booked', ?, ?)`
      )
      .run(
        salonId,
        stylistId,
        appointmentDate,
        appointmentTime,
        customerName,
        needsConsultation ? 1 : 0,
        totalAmount,
        timestamp,
        paymentMethod,
        tipAmount
      );

    const bookingId = bookingResult.lastInsertRowid;
    const insertBookingService = db.prepare(
      "INSERT INTO booking_services (booking_id, service_id) VALUES (?, ?)"
    );

    serviceIds.forEach((serviceId) => {
      insertBookingService.run(bookingId, serviceId);
    });

    return {
      bookingId: Number(bookingId),
      totalAmount,
      confirmationCode: `SN-${String(bookingId).padStart(4, "0")}`
    };
  });

  return transaction();
}

function getBookingById(bookingId) {
  const booking = db
    .prepare(
      `SELECT b.*,
              s.name AS salon_name, s.name_en AS salon_name_en, s.name_vi AS salon_name_vi,
              s.short_address AS salon_address,
              st.name AS stylist_name, st.title AS stylist_title,
              st.title_en AS stylist_title_en, st.title_vi AS stylist_title_vi
       FROM bookings b
       JOIN salons s ON s.id = b.salon_id
       JOIN stylists st ON st.id = b.stylist_id
       WHERE b.id = ?`
    )
    .get(bookingId);

  if (!booking) return null;

  const services = db
    .prepare(
      `SELECT srv.*
       FROM booking_services bs
       JOIN services srv ON srv.id = bs.service_id
       WHERE bs.booking_id = ?`
    )
    .all(bookingId)
    .map((srv) => ({
      id: srv.id,
      name: srv.name,
      nameEn: srv.name_en || srv.name,
      nameVi: srv.name_vi || srv.name,
      price: srv.price,
      durationMinutes: srv.duration_minutes,
    }));

  return {
    id: booking.id,
    confirmationCode: `SN-${String(booking.id).padStart(4, "0")}`,
    salonId: booking.salon_id,
    salonName: booking.salon_name,
    salonNameEn: booking.salon_name_en || booking.salon_name,
    salonNameVi: booking.salon_name_vi || booking.salon_name,
    salonAddress: booking.salon_address,
    stylistId: booking.stylist_id,
    stylistName: booking.stylist_name,
    stylistTitle: booking.stylist_title,
    stylistTitleEn: booking.stylist_title_en || booking.stylist_title,
    stylistTitleVi: booking.stylist_title_vi || booking.stylist_title,
    appointmentDate: booking.appointment_date,
    appointmentTime: booking.appointment_time,
    customerName: booking.customer_name,
    needsConsultation: Boolean(booking.needs_consultation),
    totalAmount: booking.total_amount,
    status: booking.status || "booked",
    paymentMethod: booking.payment_method || "card",
    tipAmount: booking.tip_amount || 0,
    reminderSentAt: booking.reminder_sent_at,
    cancelledAt: booking.cancelled_at,
    cancelReason: booking.cancel_reason,
    createdAt: booking.created_at,
    services,
  };
}

function cancelBooking(bookingId, reason) {
  const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
  if (!booking) {
    throw new Error("Booking không tồn tại.");
  }
  if (booking.status === "cancelled") {
    throw new Error("Booking đã bị hủy trước đó.");
  }

  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE bookings
       SET status = 'cancelled', cancelled_at = ?, cancel_reason = ?
       WHERE id = ?`
    ).run(new Date().toISOString(), reason || null, bookingId);

    // #17: Only re-open the time slot if appointment is in the future
    const today = formatLocalDateKey(new Date());
    if (booking.appointment_date >= today) {
      db.prepare(
        `UPDATE time_slots
         SET is_available = 1
         WHERE salon_id = ? AND slot_date = ? AND slot_time = ?`
      ).run(booking.salon_id, booking.appointment_date, booking.appointment_time);
    }
  });

  tx();
  return getBookingById(bookingId);
}

function sendReminder(bookingId) {
  const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
  if (!booking) {
    throw new Error("Booking không tồn tại.");
  }
  if (booking.status === "cancelled") {
    throw new Error("Không thể nhắc hẹn cho booking đã hủy.");
  }

  // #18: Update reminder timestamp; only change status if still 'booked'
  const now = new Date().toISOString();
  if (booking.status === "booked") {
    db.prepare("UPDATE bookings SET reminder_sent_at = ?, status = 'reminded' WHERE id = ?").run(now, bookingId);
  } else {
    db.prepare("UPDATE bookings SET reminder_sent_at = ? WHERE id = ?").run(now, bookingId);
  }

  console.log(`[reminder] Sent reminder for booking SN-${String(bookingId).padStart(4, "0")} at ${now}`);
  return getBookingById(bookingId);
}

function listBookings() {
  const bookings = db
    .prepare(
      `SELECT b.id, b.appointment_date, b.appointment_time, b.status, b.total_amount,
              b.created_at, b.payment_method, b.tip_amount,
              s.name AS salon_name, s.short_address AS salon_address,
              st.name AS stylist_name
       FROM bookings b
       JOIN salons s ON s.id = b.salon_id
       JOIN stylists st ON st.id = b.stylist_id
       ORDER BY b.created_at DESC`
    )
    .all()
    .map((b) => ({
      id: b.id,
      confirmationCode: `SN-${String(b.id).padStart(4, "0")}`,
      appointmentDate: b.appointment_date,
      appointmentTime: b.appointment_time,
      status: b.status || "booked",
      totalAmount: b.total_amount,
      paymentMethod: b.payment_method || "card",
      tipAmount: b.tip_amount || 0,
      salonName: b.salon_name,
      salonAddress: b.salon_address,
      stylistName: b.stylist_name,
      createdAt: b.created_at,
    }));

  return bookings;
}

initializeDatabase();

module.exports = {
  databasePath,
  rowsToBootstrap,
  getSlots,
  createBooking,
  getBookingById,
  cancelBooking,
  sendReminder,
  listBookings,
};
