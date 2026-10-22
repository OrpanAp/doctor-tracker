const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");

async function getDashboard(req, res, next) {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

    const [
      totalDoctors,
      activeDoctors,
      totalPatients,
      recentPatients,
      patientsByCondition,
      patientsByDoctor,
      monthlyPatientRegistrations,
      monthlyDoctorRegistrations,
    ] = await Promise.all([
      Doctor.countDocuments(),
      Doctor.countDocuments({ status: "active" }),
      Patient.countDocuments(),
      Patient.find()
        .populate("doctor", "name specialty hospital")
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
      ]),
      Patient.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      Doctor.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
    ]);

    const doctorIds = patientsByDoctor.map((item) => item._id).filter(Boolean);
    const doctors = await Doctor.find({ _id: { $in: doctorIds } }).select("name").lean();
    const doctorNames = new Map(doctors.map((doctor) => [doctor._id.toString(), doctor.name]));

    function fillMonthlySeries(aggregateRows) {
      const rowsByMonth = new Map(
        aggregateRows.map((item) => [`${item._id.year}-${item._id.month}`, item.count]),
      );
      return Array.from({ length: 6 }, (_, index) => {
        const date = new Date();
        date.setDate(1);
        date.setMonth(date.getMonth() - (5 - index));
        const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        return {
          month: date.toLocaleString("en", { month: "short" }),
          year: date.getFullYear(),
          count: rowsByMonth.get(key) || 0,
        };
      });
    }

    res.json({
      success: true,
      data: {
        totalDoctors,
        activeDoctors,
        inactiveDoctors: totalDoctors - activeDoctors,
        totalPatients,
        recentPatients,
        patientsByCondition: patientsByCondition.map((item) => ({
          condition: item._id || "Unspecified",
          count: item.count,
        })),
        patientsByDoctor: patientsByDoctor.map((item) => ({
          doctor: doctorNames.get(item._id?.toString()) || "Unknown",
          count: item.count,
        })),
        monthlyPatientRegistrations: fillMonthlySeries(monthlyPatientRegistrations),
        monthlyDoctorRegistrations: fillMonthlySeries(monthlyDoctorRegistrations),
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getDashboard };
