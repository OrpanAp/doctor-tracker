const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    specialty: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: true, trim: true },
    department: { type: String, trim: true, default: "General" },
    hospital: { type: String, trim: true, maxlength: 150, default: "" },
    experienceYears: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true },
);

doctorSchema.index({ name: 1, specialty: 1 });

module.exports = mongoose.model("Doctor", doctorSchema);
