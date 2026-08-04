const { getLedgerNamesForCollege, getConcessionReport } = require("../models/concessionModel");

const ledgerNames = async (req, res) => {
  try {
    const { collegeName } = req.query;
    if (!collegeName) {
      return res.status(400).json({ success: false, message: "collegeName is required." });
    }
    const names = await getLedgerNamesForCollege(collegeName);
    return res.status(200).json({ success: true, data: names });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const report = async (req, res) => {
  try {
    const { collegeName, ledgerName } = req.query;
    if (!collegeName) {
      return res.status(400).json({ success: false, message: "Invalid college name" });
    }

    const rows = await getConcessionReport(collegeName, ledgerName || undefined);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Sorry No Record Found" });
    }

    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { ledgerNames, report };