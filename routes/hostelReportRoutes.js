const express = require("express");
const router = express.Router();
const { hostelNames, report } = require("../controllers/hostelReportController");

router.get("/hostel-names", hostelNames);
router.get("/report", report);

module.exports = router;