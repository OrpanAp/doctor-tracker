const express = require("express");
const { requireAuth } = require("../middleware/auth");
const {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
} = require("../controllers/patientController");

const router = express.Router();

router.use(requireAuth);

router.get("/", getPatients);
router.post("/", createPatient);
router.get("/:id", getPatient);
router.patch("/:id", updatePatient);
router.delete("/:id", deletePatient);

module.exports = router;
