/**
 * Migration 001: Add i18n columns (name_en, name_vi, etc.) to all entity tables.
 */
exports.up = function (db) {
  // provinces
  db.exec(`ALTER TABLE provinces ADD COLUMN name_en TEXT NOT NULL DEFAULT ''`);
  db.exec(`ALTER TABLE provinces ADD COLUMN name_vi TEXT NOT NULL DEFAULT ''`);

  // salons
  db.exec(`ALTER TABLE salons ADD COLUMN name_en TEXT NOT NULL DEFAULT ''`);
  db.exec(`ALTER TABLE salons ADD COLUMN name_vi TEXT NOT NULL DEFAULT ''`);
  db.exec(`ALTER TABLE salons ADD COLUMN note_en TEXT NOT NULL DEFAULT ''`);
  db.exec(`ALTER TABLE salons ADD COLUMN note_vi TEXT NOT NULL DEFAULT ''`);

  // stylists
  db.exec(`ALTER TABLE stylists ADD COLUMN title_en TEXT NOT NULL DEFAULT ''`);
  db.exec(`ALTER TABLE stylists ADD COLUMN title_vi TEXT NOT NULL DEFAULT ''`);
  db.exec(`ALTER TABLE stylists ADD COLUMN specialty_en TEXT NOT NULL DEFAULT ''`);
  db.exec(`ALTER TABLE stylists ADD COLUMN specialty_vi TEXT NOT NULL DEFAULT ''`);

  // service_categories
  db.exec(`ALTER TABLE service_categories ADD COLUMN name_en TEXT NOT NULL DEFAULT ''`);
  db.exec(`ALTER TABLE service_categories ADD COLUMN name_vi TEXT NOT NULL DEFAULT ''`);
  db.exec(`ALTER TABLE service_categories ADD COLUMN teaser_en TEXT NOT NULL DEFAULT ''`);
  db.exec(`ALTER TABLE service_categories ADD COLUMN teaser_vi TEXT NOT NULL DEFAULT ''`);

  // services
  db.exec(`ALTER TABLE services ADD COLUMN name_en TEXT NOT NULL DEFAULT ''`);
  db.exec(`ALTER TABLE services ADD COLUMN name_vi TEXT NOT NULL DEFAULT ''`);
  db.exec(`ALTER TABLE services ADD COLUMN description_en TEXT NOT NULL DEFAULT ''`);
  db.exec(`ALTER TABLE services ADD COLUMN description_vi TEXT NOT NULL DEFAULT ''`);
  db.exec(`ALTER TABLE services ADD COLUMN badge_en TEXT`);
  db.exec(`ALTER TABLE services ADD COLUMN badge_vi TEXT`);
  db.exec(`ALTER TABLE services ADD COLUMN tagline_en TEXT NOT NULL DEFAULT ''`);
  db.exec(`ALTER TABLE services ADD COLUMN tagline_vi TEXT NOT NULL DEFAULT ''`);
};
