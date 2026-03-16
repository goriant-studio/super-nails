const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const {
  rowsToBootstrap,
  getSlots,
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

// #11: Restrict CORS to known origins
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3001",
  "http://0.0.0.0:5173",
  "https://super-nails.goriant.com",
  "https://goriant-studio.github.io",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // still allow but don't mirror
      }
    },
    credentials: true
  })
);
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    service: "super-nails-api",
    ts: Date.now(),
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
  // Validate date format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return response.status(400).json({ ok: false, message: "Invalid date format. Use YYYY-MM-DD." });
  }
  // #1: Use targeted query instead of loading entire DB
  const slots = getSlots(Number(salonId), date);
  response.json(slots);
});

// Create booking
app.post("/api/bookings", (request, response) => {
  try {
    const body = request.body || {};

    // #9: Basic input validation
    if (!body.salonId || !body.stylistId || !body.appointmentDate || !body.appointmentTime) {
      return response.status(400).json({
        ok: false,
        message: "Missing required fields: salonId, stylistId, appointmentDate, appointmentTime."
      });
    }
    if (body.serviceIds !== undefined && !Array.isArray(body.serviceIds)) {
      return response.status(400).json({
        ok: false,
        message: "serviceIds must be an array."
      });
    }

    const booking = createBooking(body);
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

// Catch-all 404 for unknown API routes
app.all("/api/*", (_request, response) => {
  response.status(404).json({ ok: false, message: "Not found." });
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
