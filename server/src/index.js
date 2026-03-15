const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const { rowsToBootstrap, createBooking, databasePath } = require("./db");

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

app.get("/api/bootstrap", (_request, response) => {
  response.json(rowsToBootstrap());
});

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
