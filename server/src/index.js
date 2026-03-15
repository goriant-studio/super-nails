const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const {
  rowsToBootstrap,
  createBooking,
  getBookingById,
  cancelBooking,
  sendReminder,
  listBookings,
  databasePath,
} = require("./db");

const app = express();
const port = Number(process.env.PORT || 3001);
const clientDistPath = path.join(__dirname, "..", "..", "client", "dist");

app.use(
  cors({
    origin: true,
    credentials: true
  })
);
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    databasePath
  });
});

// Static data (salons, stylists, categories, services, provinces)
app.get("/api/static", (_request, response) => {
  const data = rowsToBootstrap();
  const { timeSlots: _ts, ...staticData } = data;
  response.json(staticData);
});

// Legacy bootstrap endpoint (includes time slots)
app.get("/api/bootstrap", (_request, response) => {
  response.json(rowsToBootstrap());
});

// Slots for a specific salon + date
app.get("/api/slots", (request, response) => {
  const { salonId, date } = request.query;
  if (!salonId || !date) {
    return response.status(400).json({ ok: false, message: "salonId and date are required." });
  }
  const data = rowsToBootstrap();
  const slots = data.timeSlots.filter(
    (s) => s.salonId === Number(salonId) && s.date === date
  );
  response.json(slots);
});

// Create booking
app.post("/api/bookings", (request, response) => {
  try {
    const booking = createBooking(request.body || {});
    response.status(201).json({
      ok: true,
      booking
    });
  } catch (error) {
    const statusCode = error.code === "SLOT_UNAVAILABLE" ? 409 : 400;
    response.status(statusCode).json({
      ok: false,
      message: error.message || "Could not create booking."
    });
  }
});

// List all bookings
app.get("/api/bookings", (_request, response) => {
  try {
    const bookings = listBookings();
    response.json({ ok: true, bookings });
  } catch (error) {
    response.status(500).json({ ok: false, message: error.message });
  }
});

// Get single booking detail
app.get("/api/bookings/:id", (request, response) => {
  try {
    const booking = getBookingById(Number(request.params.id));
    if (!booking) {
      return response.status(404).json({ ok: false, message: "Booking không tồn tại." });
    }
    response.json({ ok: true, booking });
  } catch (error) {
    response.status(500).json({ ok: false, message: error.message });
  }
});

// Cancel booking
app.patch("/api/bookings/:id/cancel", (request, response) => {
  try {
    const booking = cancelBooking(Number(request.params.id), request.body?.reason);
    response.json({ ok: true, booking });
  } catch (error) {
    response.status(400).json({ ok: false, message: error.message });
  }
});

// Send reminder
app.post("/api/bookings/:id/remind", (request, response) => {
  try {
    const booking = sendReminder(Number(request.params.id));
    response.json({ ok: true, booking });
  } catch (error) {
    response.status(400).json({ ok: false, message: error.message });
  }
});

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  app.get("*", (request, response, next) => {
    if (request.path.startsWith("/api/")) {
      next();
      return;
    }

    response.sendFile(path.join(clientDistPath, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`Super Nails API running at http://localhost:${port}`);
});
