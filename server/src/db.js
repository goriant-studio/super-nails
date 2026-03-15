const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

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
    return;
  }

  const provinces = [
    [1, "TP Ho Chi Minh", "Mien Nam"],
    [2, "Ha Noi", "Mien Bac"],
    [3, "Da Nang", "Mien Trung"],
    [4, "Hai Phong", "Mien Bac"],
    [5, "Can Tho", "Mien Nam"],
    [6, "Binh Duong", "Mien Nam"],
    [7, "Dong Nai", "Mien Nam"],
    [8, "Khanh Hoa", "Mien Trung"]
  ];

  const salons = [
    [
      1,
      1,
      "Super Nails - Riverside Q7",
      "Quan 7",
      "TP Ho Chi Minh",
      "420 Huynh Tan Phat, P. Binh Thuan",
      "420 Huynh Tan Phat, Q7",
      "Gan cau Phu My, co bai do oto va phong nail signature view song.",
      12,
      5.5,
      1,
      1,
      0,
      "cobalt",
      JSON.stringify(["Midnight gloss", "Blue facade", "Spa lounge"])
    ],
    [
      2,
      1,
      "Super Nails - Nguyen Thi Thap",
      "Quan 7",
      "TP Ho Chi Minh",
      "237 Nguyen Thi Thap, P. Tan Phu",
      "237 Nguyen Thi Thap, Q7",
      "Khong gian sang va nhanh, phu hop booking sau gio lam.",
      14,
      7.1,
      1,
      0,
      1,
      "sunrise",
      JSON.stringify(["Gold bar", "Express care", "Glass storefront"])
    ],
    [
      3,
      1,
      "Super Nails - Crescent Premium",
      "Quan 7",
      "TP Ho Chi Minh",
      "408 Nguyen Thi Thap, P. Tan Quy",
      "408 Nguyen Thi Thap, Q7",
      "Premium lounge, menu cham soc chuyen sau va bai do xe rong.",
      16,
      7.5,
      1,
      1,
      1,
      "emerald",
      JSON.stringify(["Emerald lounge", "Private suite", "Art wall"])
    ],
    [
      4,
      1,
      "Super Nails - Tran Nao",
      "Quan 2",
      "TP Ho Chi Minh",
      "103 Tran Nao, P. Binh An",
      "103 Tran Nao, Quan 2",
      "Chi nhanh gan trung tam moi, phu hop combo cham soc da va nail art.",
      18,
      9.1,
      0,
      1,
      1,
      "violet",
      JSON.stringify(["Sky blue", "Signature room", "Soft glow"])
    ],
    [
      5,
      1,
      "Super Nails - Ton Dan",
      "Quan 4",
      "TP Ho Chi Minh",
      "25 Ton Dan, P. 13",
      "25 Ton Dan, Quan 4",
      "Diem hen nhanh cho khach yeu thich caticle clean va gel box.",
      20,
      9.7,
      0,
      0,
      1,
      "rose",
      JSON.stringify(["Rose studio", "Glass shelves", "Velvet seats"])
    ],
    [
      6,
      3,
      "Super Nails - Hai Chau",
      "Hai Chau",
      "Da Nang",
      "88 Bach Dang, Hai Chau",
      "88 Bach Dang, Da Nang",
      "Phong cach resort, phu hop khach du lich muon booking nhanh bang PWA.",
      11,
      4.2,
      1,
      1,
      1,
      "sand",
      JSON.stringify(["Beach light", "Clean station", "River view"])
    ]
  ];

  const stylists = [
    [1, 1, "Linh", "Master Nail Artist", "Gel ombre va charm stone", "cobalt"],
    [2, 1, "An", "Senior Stylist", "Pedicure spa va French tips", "sunrise"],
    [3, 1, "Vy", "Signature Artist", "Minimal chrome va cat eye", "violet"],
    [4, 2, "Hanh", "Senior Stylist", "Combo nhanh sau gio lam", "emerald"],
    [5, 2, "My", "Color Specialist", "Nhuom nail jelly va seasonal palette", "rose"],
    [6, 3, "Nhi", "Premium Artist", "Builder gel va bridal set", "gold"],
    [7, 3, "Tram", "Spa Lead", "Cham soc da tay chan chuyen sau", "emerald"],
    [8, 4, "Thu", "Creative Lead", "Airbrush va line art", "violet"],
    [9, 4, "Bao", "Spa Stylist", "Head spa va cham soc cuticle", "sand"],
    [10, 5, "Khanh", "Signature Artist", "Box short set va nude collection", "rose"],
    [11, 6, "Ha", "Resort Stylist", "Recovery spa va premium polish", "sand"]
  ];

  const categories = [
    [1, "combo-moi", "Combo moi va hot", "Nhung goi dang duoc dat nhieu trong tuan"],
    [2, "nail-co-ban", "Nail co ban", "Cat da, son gel va design nhe cho lich hen nhanh"],
    [3, "nail-art", "Nail art va premium", "Builder gel, charm da va bo suu tap dep sang"],
    [4, "pedicure", "Pedicure va cham soc", "Lam sach, massage va duong am chan"],
    [5, "spa", "Spa thu gian", "Massage tay chan va phuc hoi da"]
  ];

  const services = [
    [
      1,
      1,
      "Shine Combo 1",
      "Cat da, son gel mot mau va massage tay 10 phut.",
      45,
      122000,
      "Dong gia cuoi tuan",
      "cobalt",
      "Nhanh, gon va de dat lich"
    ],
    [
      2,
      1,
      "Shine Combo 2",
      "Cat da, son gel, cham soc cuticle va dap mat na tay.",
      60,
      205000,
      "Moi",
      "violet",
      "Combo de chot lich nhieu nhat"
    ],
    [
      3,
      1,
      "Shine Combo 3",
      "Builder gel tu nhien, massage co vai va phu kien nhe.",
      75,
      309000,
      "Premium",
      "emerald",
      "Di kem thu gian co vai gay"
    ],
    [
      4,
      2,
      "Cat xa express",
      "Cat da nhanh, duong mong va son duong bong.",
      30,
      97000,
      null,
      "sunrise",
      "Phu hop lich hen 30 phut"
    ],
    [
      5,
      2,
      "French tip soft",
      "Nen gel trong va ve French tip tay cong mem.",
      40,
      149000,
      null,
      "cobalt",
      "Classic nhung van rat sang"
    ],
    [
      6,
      3,
      "Cat eye galaxy",
      "Son gel cat eye nhieu lop va hieu ung anh kim.",
      55,
      229000,
      "Hot trend",
      "violet",
      "Len anh dep tren iPhone"
    ],
    [
      7,
      3,
      "Bridal crystal set",
      "Bo nail cuoi voi charm da, line art va builder gel.",
      90,
      429000,
      "Premium",
      "gold",
      "Danh cho ngay dac biet"
    ],
    [
      8,
      4,
      "Pedicure refresh",
      "Lam sach goc chan, tay da chet va son gel chan.",
      50,
      189000,
      null,
      "emerald",
      "Chan nhe va sach se hon"
    ],
    [
      9,
      4,
      "Luxury spa pedicure",
      "Pedicure co massage da nong, muoi ngam va serum phuc hoi.",
      65,
      259000,
      "Thu gian",
      "sand",
      "Rat hop cho cuoi tuan"
    ],
    [
      10,
      5,
      "Hand recovery ritual",
      "Tay te bao chet, massage, serum va paraffin mem da.",
      35,
      164000,
      null,
      "rose",
      "Duong am va phuc hoi nhanh"
    ]
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
}

function buildSlotRows() {
  const salons = db.prepare("SELECT id FROM salons ORDER BY id").all();
  const rows = [];
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const times = [
    "10:00",
    "10:20",
    "10:40",
    "11:00",
    "11:20",
    "11:40",
    "12:00",
    "13:00",
    "13:20",
    "13:40",
    "14:00",
    "14:20",
    "15:00",
    "15:20",
    "15:40",
    "16:00",
    "16:20",
    "16:40",
    "17:00",
    "17:20",
    "17:40",
    "18:00",
    "18:20",
    "18:40",
    "19:00",
    "19:20",
    "19:40",
    "20:00",
    "20:20",
    "20:40",
    "21:00",
    "21:20"
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
        const busyPattern = (salon.id * 11 + dayOffset * 5 + index) % 9;
        const isAvailable = busyPattern === 0 && hour >= 21 ? 0 : busyPattern > 1 ? 1 : 0;

        rows.push([salon.id, isoDate, time, isPeak, isAvailable]);
      });
    }
  });

  return rows;
}

function refreshTimeSlots() {
  const slotRows = buildSlotRows();
  const deleteSlots = db.prepare("DELETE FROM time_slots");
  const insertSlot = db.prepare(
    "INSERT INTO time_slots (salon_id, slot_date, slot_time, is_peak, is_available) VALUES (?, ?, ?, ?, ?)"
  );
  const bookedSlots = db
    .prepare("SELECT salon_id, appointment_date, appointment_time FROM bookings")
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

function initializeDatabase() {
  createTables();
  seedStaticData();
  refreshTimeSlots();
}

function rowsToBootstrap() {
  const provinces = db.prepare("SELECT * FROM provinces ORDER BY name").all();
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
      district: salon.district,
      city: salon.city,
      street: salon.street,
      shortAddress: salon.short_address,
      note: salon.note,
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
      specialty: stylist.specialty,
      accent: stylist.accent
    }));

  const categories = db
    .prepare("SELECT * FROM service_categories ORDER BY id")
    .all()
    .map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
      teaser: category.teaser
    }));

  const services = db
    .prepare("SELECT * FROM services ORDER BY id")
    .all()
    .map((service) => ({
      id: service.id,
      categoryId: service.category_id,
      name: service.name,
      description: service.description,
      durationMinutes: service.duration_minutes,
      price: service.price,
      badge: service.badge,
      accent: service.accent,
      tagline: service.tagline
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
    customerName = "Guest"
  } = payload;

  if (!salonId || !stylistId || !appointmentDate || !appointmentTime || !Array.isArray(serviceIds)) {
    throw new Error("Missing booking information.");
  }

  if (serviceIds.length === 0 && !needsConsultation) {
    throw new Error("Please choose at least one service or request a consultation.");
  }

  const slot = db
    .prepare(
      `SELECT *
       FROM time_slots
       WHERE salon_id = ? AND slot_date = ? AND slot_time = ?`
    )
    .get(salonId, appointmentDate, appointmentTime);

  if (!slot || !slot.is_available) {
    const slotError = new Error("Selected slot is no longer available.");
    slotError.code = "SLOT_UNAVAILABLE";
    throw slotError;
  }

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
    throw new Error("Some services could not be found.");
  }

  const totalAmount = services.reduce((sum, service) => sum + service.price, 0);
  const timestamp = new Date().toISOString();

  const transaction = db.transaction(() => {
    const bookingResult = db
      .prepare(
        `INSERT INTO bookings (
          salon_id, stylist_id, appointment_date, appointment_time, customer_name, needs_consultation, total_amount, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        salonId,
        stylistId,
        appointmentDate,
        appointmentTime,
        customerName,
        needsConsultation ? 1 : 0,
        totalAmount,
        timestamp
      );

    const bookingId = bookingResult.lastInsertRowid;
    const insertBookingService = db.prepare(
      "INSERT INTO booking_services (booking_id, service_id) VALUES (?, ?)"
    );

    serviceIds.forEach((serviceId) => {
      insertBookingService.run(bookingId, serviceId);
    });

    db.prepare(
      `UPDATE time_slots
       SET is_available = 0
       WHERE salon_id = ? AND slot_date = ? AND slot_time = ?`
    ).run(salonId, appointmentDate, appointmentTime);

    return {
      bookingId: Number(bookingId),
      totalAmount,
      confirmationCode: `SN-${String(bookingId).padStart(4, "0")}`
    };
  });

  return transaction();
}

initializeDatabase();

module.exports = {
  databasePath,
  rowsToBootstrap,
  createBooking
};
