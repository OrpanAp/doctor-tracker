require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const Doctor = require("../src/models/Doctor");

async function backfillHospital() {
  await connectDB();
  const result = await Doctor.updateMany(
    { $or: [{ hospital: { $exists: false } }, { hospital: null }, { hospital: "" }] },
    { $set: { hospital: "Not specified" } },
  );
  console.log(`Updated ${result.modifiedCount} doctor record(s). Review records with "Not specified" and enter the real hospital.`);
}

backfillHospital()
  .catch((error) => {
    console.error("Hospital backfill failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });
