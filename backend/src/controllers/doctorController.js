const mongoose = require("mongoose");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const { escapeRegex, buildDateRange } = require("../utils/queryFilters");

async function getDoctors(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 10),
    );

    const filter = {};
    const search = String(req.query.search || "").trim();

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [{ name: regex }, { specialty: regex }, { email: regex }, { hospital: regex }, { phone: regex }];
    }

    if (["active", "inactive"].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    if (req.query.specialty) {
      filter.specialty = { $regex: escapeRegex(String(req.query.specialty).trim()), $options: "i" };
    }

    if (req.query.hospital) {
      filter.hospital = { $regex: escapeRegex(String(req.query.hospital).trim()), $options: "i" };
    }

    const dateRange = buildDateRange(req.query.dateFrom, req.query.dateTo);
    if (dateRange.error) return res.status(400).json({ success: false, message: dateRange.error });
    if (dateRange.filter) filter.createdAt = dateRange.filter;

    const [doctors, total] = await Promise.all([
      Doctor.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Doctor.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: doctors,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getDoctor(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid doctor ID" });
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }
    res.json({ success: true, data: doctor });
  } catch (error) {
    next(error);
  }
}

async function createDoctor(req, res, next) {
  try {
    const {
      name,
      specialty,
      email,
      phone,
      hospital,
      department,
      experienceYears,
      status,
    } = req.body;

    if (
      !name?.trim() ||
      !specialty?.trim() ||
      !hospital?.trim() ||
      !email?.trim() ||
      !phone?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, specialty, hospital, email and phone are required",
      });
    }

    const doctor = await Doctor.create({
      name,
      specialty,
      email,
      phone,
      hospital,
      department,
      experienceYears,
      status,
    });

    res.status(201).json({ success: true, data: doctor });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A doctor with this email already exists",
      });
    }
    next(error);
  }
}

async function updateDoctor(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid doctor ID" });
    const allowed = [
      "name",
      "specialty",
      "email",
      "phone",
      "hospital",
      "department",
      "experienceYears",
      "status",
    ];

    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
    }

    const doctor = await Doctor.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    res.json({ success: true, data: doctor });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A doctor with this email already exists",
      });
    }
    next(error);
  }
}

async function deleteDoctor(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid doctor ID" });
    const assignedPatients = await Patient.countDocuments({ doctor: req.params.id });
    if (assignedPatients > 0) {
      return res.status(409).json({ success: false, message: `Cannot delete this doctor while ${assignedPatients} patient(s) are assigned. Reassign or delete those patients first.` });
    }
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }
    res.json({ success: true, message: "Doctor deleted successfully" });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  deleteDoctor,
};
