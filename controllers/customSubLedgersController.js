const {
  getColleges,
  getHeads,
  getCourses,
  getBatches,
  getSemesters,
  getCustomSubLedgerReport,
} = require("../models/customSubLedgersModel");

const getCollegesList = async (req, res) => {
  try {
    const colleges = await getColleges();
    return res.status(200).json({ success: true, colleges });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getCollegeDependentOptions = async (req, res) => {
  try {
    const { collegeName } = req.query;
    if (!collegeName) {
      return res.status(400).json({ success: false, message: "collegeName is required" });
    }

    const [heads, courses, batches, semesters] = await Promise.all([
      getHeads(collegeName),
      getCourses(collegeName),
      getBatches(collegeName),
      getSemesters(collegeName),
    ]);

    return res.status(200).json({
      success: true,
      heads,
      courses,
      batches,
      semesters,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getReport = async (req, res) => {
  try {
    const {
      collegeName,
      dateFrom,
      dateTo,
      course,
      batch,
      semester,
      session,
      heads,
    } = req.query;

    if (!collegeName) {
      return res.status(400).json({ success: false, message: "Please Specify College" });
    }

    const headsArray = heads ? String(heads).split(",").filter(Boolean) : [];

    const result = await getCustomSubLedgerReport({
      collegeName,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      course: course || undefined,
      batch: batch || undefined,
      semester: semester || undefined,
      session: session || undefined,
      heads: headsArray,
    });

    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getCollegesList, getCollegeDependentOptions, getReport };