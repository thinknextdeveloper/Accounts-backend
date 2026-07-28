const { sql, getPool } = require("../config/db");

const getColleges = async () => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT DISTINCT CollegeName FROM MasterCollege ORDER BY CollegeName
  `);
  return result.recordset.map((r) => r.CollegeName);
};

// Mirrors VB cmbcollege_SelectedIndexChanged: distinct Head from MasterHeads,
// ordered by ID — these become the CheckedListBox1 items.
const getHeads = async (collegeName) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("CollegeName", sql.NVarChar, collegeName)
    .query(`
      SELECT DISTINCT Head, ID FROM Masterheads
      WHERE CollegeName = @CollegeName
      ORDER BY ID
    `);
  return result.recordset.map((r) => r.Head);
};

const getCourses = async (collegeName) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("CollegeName", sql.NVarChar, collegeName)
    .query(`SELECT DISTINCT Course FROM Ledger WHERE CollegeName = @CollegeName ORDER BY Course`);
  return result.recordset.map((r) => r.Course);
};

const getBatches = async (collegeName) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("CollegeName", sql.NVarChar, collegeName)
    .query(`SELECT DISTINCT Batch FROM Ledger WHERE CollegeName = @CollegeName ORDER BY Batch`);
  return result.recordset.map((r) => r.Batch);
};

const getSemesters = async (collegeName) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("CollegeName", sql.NVarChar, collegeName)
    .query(`
      SELECT DISTINCT Semester, SemesterID FROM Ledger
      WHERE CollegeName = @CollegeName
      ORDER BY SemesterID
    `);
  return result.recordset.map((r) => r.Semester);
};

/**
 * Mirrors VB Display(): pulls base receipt rows (Credit, ReceiptType =
 * 'Multiple', matching the selected college/course/batch/semester/session/
 * date range), then pivots in SUM(Credit) per SubLedgers.Subhead for each
 * selected head — but batched in ONE grouped query across all matching
 * ReceiptNos, instead of VB's GetHeadvalue() being called once per
 * cell (rows × heads round trips). Also computes the footer "Total" row
 * VB builds manually at the bottom of dgvDetail.
 */
const getCustomSubLedgerReport = async (filters) => {
  const {
    collegeName,
    dateFrom,
    dateTo,
    course,
    batch,
    semester,
    session,
    heads,
  } = filters;

  const pool = await getPool();
  const baseRequest = pool.request();

  let query = `
    SELECT DateEntry, ReceiptNo, IDNo, ClassRollNo, UniRollNo, StudentName, FatherName
    FROM Ledger
    WHERE TransactionType = 'Credit' AND ReceiptType = 'Multiple' AND CollegeName = @CollegeName
  `;
  baseRequest.input("CollegeName", sql.NVarChar, collegeName);

  if (dateFrom && dateTo) {
    query += ` AND DateEntry BETWEEN @DateFrom AND @DateTo`;
    baseRequest.input("DateFrom", sql.DateTime, dateFrom);
    baseRequest.input("DateTo", sql.DateTime, dateTo);
  }
  if (course) {
    query += ` AND Course = @Course`;
    baseRequest.input("Course", sql.NVarChar, course);
  }
  if (batch) {
    query += ` AND Batch = @Batch`;
    baseRequest.input("Batch", sql.Int, batch);
  }
  if (semester) {
    query += ` AND Semester = @Semester`;
    baseRequest.input("Semester", sql.NVarChar, semester);
  }
  if (session) {
    query += ` AND Session = @Session`;
    baseRequest.input("Session", sql.NVarChar, session);
  }

  query += ` ORDER BY ReceiptNo`;

  const baseResult = await baseRequest.query(query);
  const baseRows = baseResult.recordset;

  const selectedHeads = heads && heads.length > 0 ? heads : [];

  if (baseRows.length === 0) {
    return { rows: [], headers: selectedHeads, totalRecords: 0, columnTotals: {}, grandTotal: 0 };
  }

  const receiptNos = [...new Set(baseRows.map((r) => r.ReceiptNo))];

  const subRequest = pool.request();
  subRequest.input("CollegeName", sql.NVarChar, collegeName);
  if (session) subRequest.input("Session", sql.NVarChar, session);

  const receiptParams = receiptNos
    .map((no, i) => {
      const key = `Receipt${i}`;
      subRequest.input(key, sql.Int, no);
      return `@${key}`;
    })
    .join(",");

  let subQuery = `
    SELECT ReceiptNo, Subhead, SUM(Credit) AS Credit
    FROM SubLedgers
    WHERE CollegeName = @CollegeName AND TransactionType = 'Credit'
      AND ReceiptNo IN (${receiptParams})
  `;
  if (session) subQuery += ` AND Session = @Session`;
  subQuery += ` GROUP BY ReceiptNo, Subhead`;

  const subResult = await subRequest.query(subQuery);

  // receiptNo -> { subhead: creditSum }
  const subMap = {};
  subResult.recordset.forEach((r) => {
    if (!subMap[r.ReceiptNo]) subMap[r.ReceiptNo] = {};
    subMap[r.ReceiptNo][r.Subhead] = Number(r.Credit) || 0;
  });

  const columnTotals = {};
  selectedHeads.forEach((h) => (columnTotals[h] = 0));
  let grandTotal = 0;

  const rows = baseRows.map((r) => {
    const headValues = {};
    let rowTotal = 0;
    selectedHeads.forEach((h) => {
      const val = subMap[r.ReceiptNo]?.[h] || 0;
      headValues[h] = val;
      rowTotal += val;
      columnTotals[h] += val;
    });
    grandTotal += rowTotal;

    return {
      DateEntry: r.DateEntry,
      ReceiptNo: r.ReceiptNo,
      IDNo: r.IDNo,
      ClassRollNo: r.ClassRollNo,
      UniRollNo: r.UniRollNo,
      StudentName: r.StudentName,
      FatherName: r.FatherName,
      heads: headValues,
      total: rowTotal,
    };
  });

  return {
    rows,
    headers: selectedHeads,
    totalRecords: rows.length,
    columnTotals,
    grandTotal,
  };
};

module.exports = {
  getColleges,
  getHeads,
  getCourses,
  getBatches,
  getSemesters,
  getCustomSubLedgerReport,
};