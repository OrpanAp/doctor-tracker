const express = require("express");
const { requireAuth } = require("../middleware/auth");
const {
  getDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} = require("../controllers/doctorController");

const router = express.Router();

router.use(requireAuth);

router.get("/", getDoctors);
router.post("/", createDoctor);
router.get("/:id", getDoctor);
router.patch("/:id", updateDoctor);
router.delete("/:id", deleteDoctor);

module.exports = router;
