const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const studentActivityFundController = require("../controllers/studentActivityFundController");

// Protect all routes with JWT authentication
router.use(authenticateToken);

// Display records from MasterStudentActivityFund
router.get("/display", studentActivityFundController.getStudentActivityFunds);

// Add new record to MasterStudentActivityFund
router.post("/add", studentActivityFundController.createStudentActivityFund);

// Helper dropdown routes for Scheme and Category
router.get("/schemes", studentActivityFundController.getSchemes);
router.get("/categories", studentActivityFundController.getCategories);

module.exports = router;
