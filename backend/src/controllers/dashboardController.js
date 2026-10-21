const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");

async function getDashboard(req, res, next) {
  try {
    const [
      totalDoctors,
      activeDoctors,
      totalPatients,
      recentPatients,
      patientsByCondition,
      patientsByDoctor,
    ] = await Promise.all([
      Doctor.countDocuments(),
      Doctor.countDocuments({ status: "active" }),
      Patient.countDocuments(),
      Patient.find()
        .populate("doctor", "name specialty")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Patient.aggregate([
        { $group: { _id: "$condition", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      Patient.aggregate([
        { $group: { _id: "$doctor", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const doctorIds = patientsByDoctor.map((item) => item._id);
    const doctors = await Doctor.find({ _id: { $in: doctorIds } })
      .select("name")
      .lean();
    const doctorNames = new Map(
      doctors.map((doctor) => [doctor._id.toString(), doctor.name]),
    );

    res.json({
      success: true,
      data: {
        totalDoctors,
        activeDoctors,
        inactiveDoctors: totalDoctors - activeDoctors,
        totalPatients,
        recentPatients,
        patientsByCondition: patientsByCondition.map((item) => ({
          condition: item._id,
          count: item.count,
        })),
        patientsByDoctor: patientsByDoctor.map((item) => ({
          doctor: doctorNames.get(item._id.toString()) || "Unknown",
          count: item.count,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getDashboard };
