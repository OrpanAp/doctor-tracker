const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    age: {
      type: Number,
      required: true,
      min: 0,
      max: 125,
    },
    condition: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
  },
  { timestamps: true },
);

patientSchema.index({ doctor: 1, createdAt: -1 });
patientSchema.index({ condition: 1 });
patientSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Patient", patientSchema);
