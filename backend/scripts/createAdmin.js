require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const User = require("../src/models/User");

async function createAdmin() {
  const name = String(process.env.ADMIN_NAME || "").trim();
  const email = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password || password.length < 12) {
    throw new Error("Set ADMIN_NAME, ADMIN_EMAIL, and an ADMIN_PASSWORD of at least 12 characters in backend/.env before running this script.");
  }

  await connectDB();
  const existing = await User.findOne({ email }).select("_id");
  if (existing) {
    console.log(`Administrator ${email} already exists. No changes were made.`);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  await User.create({ name, email, password: hashedPassword, role: "admin" });
  console.log(`Administrator ${email} created successfully.`);
}

createAdmin()
  .catch((error) => {
    console.error("Could not create administrator:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });
