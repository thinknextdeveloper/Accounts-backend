const express = require("express");
const router = express.Router();

const {
  getCollegesList,
  getCollegeDependentOptions,
  getReport,
} = require("../controllers/customSubLedgersController");

router.get("/colleges", getCollegesList);
router.get("/options", getCollegeDependentOptions);
router.get("/report", getReport);

module.exports = router;