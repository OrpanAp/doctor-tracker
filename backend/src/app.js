const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const patientRoutes = require("./routes/patientRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Doctor Tracker API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Central error handler — keep this last
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  console.error(err.message);

  if (err.name === "ValidationError" || err.name === "CastError") {
    return res.status(400).json({ success: false, message: "Invalid request data", details: err.message });
  }
  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: "A record with this value already exists" });
  }
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.statusCode && err.statusCode < 500 ? err.message : "Internal server error",
  });
});

module.exports = app;
