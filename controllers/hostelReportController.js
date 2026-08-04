const { getHostelNames, getHostelReport } = require("../models/hostelReportModel");

const hostelNames = async (req, res) => {
  try {
    const names = await getHostelNames();
    return res.status(200).json({ success: true, data: names });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const report = async (req, res) => {
  try {
    const { collegeName, hostelName } = req.query;

    if (!hostelName) {
      return res.status(400).json({ success: false, message: "Please Select Hostel Name" });
    }

    const rows = await getHostelReport(collegeName || undefined, hostelName);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Sorry No Record Found" });
    }

    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { hostelNames, report };