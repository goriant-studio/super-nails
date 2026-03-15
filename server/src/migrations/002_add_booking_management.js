/**
 * Migration 002: Add booking management fields (status, reminder, cancellation, payment).
 */
exports.up = function (db) {
  // Booking status + management fields
  db.exec(`ALTER TABLE bookings ADD COLUMN status TEXT NOT NULL DEFAULT 'booked'`);
  db.exec(`ALTER TABLE bookings ADD COLUMN reminder_sent_at TEXT`);
  db.exec(`ALTER TABLE bookings ADD COLUMN cancelled_at TEXT`);
  db.exec(`ALTER TABLE bookings ADD COLUMN cancel_reason TEXT`);
  db.exec(`ALTER TABLE bookings ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'card'`);
  db.exec(`ALTER TABLE bookings ADD COLUMN tip_amount INTEGER NOT NULL DEFAULT 0`);
};
