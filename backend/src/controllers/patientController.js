const mongoose = require("mongoose");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const { escapeRegex, buildDateRange } = require("../utils/queryFilters");

async function getPatients(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 10),
    );
    const filter = {};

    if (req.query.doctor) {
      if (!mongoose.isValidObjectId(req.query.doctor)) {
        return res.status(400).json({ success: false, message: "Invalid doctor filter" });
      }
      filter.doctor = req.query.doctor;
    }

    if (req.query.condition) {
      filter.condition = {
        $regex: String(req.query.condition).replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&",
        ),
        $options: "i",
      };
    }

    const dateRange = buildDateRange(req.query.dateFrom, req.query.dateTo);
    if (dateRange.error) return res.status(400).json({ success: false, message: dateRange.error });
    if (dateRange.filter) filter.createdAt = dateRange.filter;

    if (req.query.search) {
      const search = String(req.query.search)
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { condition: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const [patients, total] = await Promise.all([
      Patient.find(filter)
        .populate("doctor", "name specialty")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Patient.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: patients,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
}

async function getPatient(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid patient ID" });
    }

    const patient = await Patient.findById(req.params.id).populate(
      "doctor",
      "name specialty",
    );
    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found" });
    }

    res.json({ success: true, data: patient });
  } catch (error) {
    next(error);
  }
}

async function createPatient(req, res, next) {
  try {
    const { doctor, name, age, condition, phone } = req.body;

    if (!doctor || !mongoose.isValidObjectId(doctor)) {
      return res
        .status(400)
        .json({ success: false, message: "A valid doctor ID is required" });
    }
    if (
      !name?.trim() ||
      age === undefined ||
      age === "" ||
      !condition?.trim() ||
      !phone?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, age, condition and phone are required",
      });
    }

    if (
      !Number.isInteger(Number(age)) ||
      Number(age) < 0 ||
      Number(age) > 125
    ) {
      return res.status(400).json({
        success: false,
        message: "Age must be an integer from 0 to 125",
      });
    }

    if (!(await Doctor.exists({ _id: doctor }))) {
      return res
        .status(400)
        .json({ success: false, message: "Selected doctor does not exist" });
    }

    const patient = await Patient.create({
      doctor,
      name,
      age: Number(age),
      condition,
      phone,
    });
    await patient.populate("doctor", "name specialty");

    res.status(201).json({ success: true, data: patient });
  } catch (error) {
    next(error);
  }
}

async function updatePatient(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid patient ID" });
    }

    const allowed = ["doctor", "name", "age", "condition", "phone"];
    const updates = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) return res.status(400).json({ success: false, message: "Provide at least one field to update" });

    if (updates.doctor && !mongoose.isValidObjectId(updates.doctor)) return res.status(400).json({ success: false, message: "Invalid doctor ID" });
    if (updates.doctor && !(await Doctor.exists({ _id: updates.doctor }))) {
      return res
        .status(400)
        .json({ success: false, message: "Selected doctor does not exist" });
    }

    const patient = await Patient.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate("doctor", "name specialty");

    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found" });
    }

    res.json({ success: true, data: patient });
  } catch (error) {
    next(error);
  }
}

async function deletePatient(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid patient ID" });
    }

    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found" });
    }

    res.json({ success: true, message: "Patient deleted successfully" });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
};
