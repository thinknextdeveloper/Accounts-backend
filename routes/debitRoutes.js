// routes/debitRoutes.js
const express = require("express");
const router = express.Router();

const {
  findStudent,
  saveDebit,
  getMetaOptions,
} = require("../controllers/debitController");

router.get("/meta-options", getMetaOptions);
router.get("/:idNo", findStudent);
router.post("/:idNo/save", saveDebit);

module.exports = router;