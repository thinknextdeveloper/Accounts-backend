const studentActivityFundService = require("../services/studentActivityFundService");

const getAuthenticatedUsername = (req) => {
  return req.user?.username || req.user?.UserName || req.query.username;
};

const getStudentActivityFunds = async (req, res) => {
  try {
    const username = getAuthenticatedUsername(req);
    if (!username) {
      return res.status(401).json({
        success: false,
        message: "User authentication required.",
      });
    }

    const { session, collegeName, course, batch, semester } = req.query;
    const result = await studentActivityFundService.getStudentActivityFunds(username, {
      session,
      collegeName,
      course,
      batch,
      semester,
    });

    return res.status(200).json({
      success: true,
      message: "Student activity fund records retrieved successfully.",
      data: result.records,
      totalRecords: result.totalRecords,
    });
  } catch (error) {
    console.error("Error in getStudentActivityFunds controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch student activity fund records.",
    });
  }
};

const createStudentActivityFund = async (req, res) => {
  try {
    const username = getAuthenticatedUsername(req);
    if (!username) {
      return res.status(401).json({
        success: false,
        message: "User authentication required.",
      });
    }

    await studentActivityFundService.createStudentActivityFund(username, req.body);

    return res.status(201).json({
      success: true,
      message: "Student activity fund record added successfully!",
    });
  } catch (error) {
    console.error("Error in createStudentActivityFund controller:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to add student activity fund record.",
    });
  }
};

const getSchemes = async (req, res) => {
  try {
    const username = getAuthenticatedUsername(req);
    const schemes = await studentActivityFundService.getSchemes(username);
    return res.status(200).json({
      success: true,
      data: schemes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch schemes.",
    });
  }
};

const getCategories = async (req, res) => {
  try {
    const username = getAuthenticatedUsername(req);
    const categories = await studentActivityFundService.getCategories(username);
    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch categories.",
    });
  }
};

module.exports = {
  getStudentActivityFunds,
  createStudentActivityFund,
  getSchemes,
  getCategories,
};
