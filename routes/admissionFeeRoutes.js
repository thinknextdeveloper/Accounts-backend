const express = require("express");
const router = express.Router();

const {
  findStudent,
  saveFee,
  getAdmissionMetaOptions,
  updateAdmissionMeta,
} = require("../controllers/admissionFeeController");

router.get("/meta-options", getAdmissionMetaOptions);
router.get("/:idNo", findStudent);
router.post("/:idNo/save", saveFee);
router.put("/:idNo/update", updateAdmissionMeta);

module.exports = router;