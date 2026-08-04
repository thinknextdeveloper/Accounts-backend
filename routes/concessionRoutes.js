const express = require("express");
const router = express.Router();
const { ledgerNames, report } = require("../controllers/concessionController");

router.get("/ledger-names", ledgerNames);
router.get("/report", report);

module.exports = router;