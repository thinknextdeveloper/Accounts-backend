const express = require("express");
const router = express.Router();
const { displayFeeStructure, saveFeeStructure } = require("../controllers/masterAnnualFeeController");

router.get("/display", displayFeeStructure);
router.post("/save", saveFeeStructure);

module.exports = router;