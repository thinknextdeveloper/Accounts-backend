// controllers/debitController.js
const {
  getStudentByIdNo,
  createStudent,
  updateFacilityDetail,
  saveDebitEntry,
  getHostelNames,
  getRoomTypes,
  getRoutes,
  getStopages,
} = require("../models/debitModel");

const {
  getCategories,
  getModesOfAdmission,
  getCurrentMasterSession,
} = require("../models/admissionFeeModel");
const { getPool, sql } = require("../config/db");
// const sql = require("mssql");


// controllers/debitController.js — replace getFeeHeads with this


// const getFeeHeads = async (req, res) => {
//   try {
//     const { idNo, semester, feeCategory, modeOfAdmission } = req.query;

//     if (!idNo || !semester || !feeCategory) {
//       return res.status(400).json({
//         success: false,
//         message: "idNo, semester, and feeCategory are required",
//       });
//     }

//     const pool = await getPool();

//     const studentResult = await pool
//       .request()
//       .input("IDNo", sql.BigInt, idNo)
//       .query(`
//         SELECT CollegeName, Course, Batch, Scheme
//         FROM Admissions
//         WHERE IDNo = @IDNo
//       `);

//     const student = studentResult.recordset[0];
//     if (!student) {
//       return res.status(404).json({ success: false, message: "Student not found" });
//     }

//     // FIX: aggregate MasterAnnualFee by Head FIRST (in a subquery, with all
//     // matching conditions in WHERE, not ON), so multiple matching fee rows
//     // for the same head collapse into ONE row (Credit = SUM of amounts).
//     // Then LEFT JOIN that aggregated result onto MasterHeads on Head alone.
//     // Result: every head appears exactly once.
//     //   - a head with two matching MasterAnnualFee rows (30,500 + 39,000)
//     //     now shows ONE row with Credit = 69,500 (adjust to MAX/first-match
//     //     below if you actually want "pick one", not "sum them")
//     //   - a head with zero matching rows still shows ONE row, Credit = 0
//     const request = pool.request()
//       .input("CollegeName", sql.VarChar, student.CollegeName)
//       .input("Course", sql.VarChar, student.Course || "")
//       .input("Batch", sql.VarChar, student.Batch ? String(student.Batch) : "")
//       .input("Semester", sql.VarChar, semester)
//       .input("Category", sql.VarChar, feeCategory);

//     let whereConditions = `
//         MasterAnnualFee.CollegeName = @CollegeName
//         AND MasterAnnualFee.Course = @Course
//         AND MasterAnnualFee.Batch = @Batch
//         AND MasterAnnualFee.Semester = @Semester
//         AND MasterAnnualFee.Category = @Category
//     `;

//     if (student.Scheme) {
//       request.input("Scheme", sql.VarChar, student.Scheme);
//       whereConditions += ` AND MasterAnnualFee.Scheme = @Scheme`;
//     }
//     if (modeOfAdmission) {
//       request.input("ModeOfAdmission", sql.VarChar, modeOfAdmission);
//       whereConditions += ` AND MasterAnnualFee.ModeOfAdmission = @ModeOfAdmission`;
//     }

//     // If you want "pick one row" instead of "sum duplicates", swap the
//     // aggregated CTE below for:
//     //   SELECT Head, MIN(Amount) AS Credit   -- or MAX(Amount), or TOP 1 via ROW_NUMBER()
//     const query = `
//       WITH AggregatedFee AS (
//         SELECT
//           MasterAnnualFee.Head,
//           SUM(MasterAnnualFee.Amount) AS Credit
//         FROM MasterAnnualFee
//         WHERE ${whereConditions}
//         GROUP BY MasterAnnualFee.Head
//       )
//       SELECT
//         MasterHeads.Head,
//         AggregatedFee.Credit
//       FROM MasterHeads
//       LEFT JOIN AggregatedFee
//         ON AggregatedFee.Head = MasterHeads.Head
//       WHERE MasterHeads.CollegeName = @CollegeName
//       ORDER BY MasterHeads.ID
//     `;

//     const headsResult = await request.query(query);

//     const feeHeads = headsResult.recordset.map((row) => ({
//       head: row.Head,
//       credit: row.Credit || 0,
//     }));

//     const totalCredit = feeHeads.reduce((sum, h) => sum + h.credit, 0);

//     return res.status(200).json({
//       success: true,
//       feeHeads,
//       totalCredit,
//     });
//   } catch (err) {
//     console.log(err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };

// const getFeeHeads = async (req, res) => {
//   try {
//     const { idNo, semester, feeCategory, modeOfAdmission, debug } = req.query;

//     if (!idNo || !semester || !feeCategory) {
//       return res.status(400).json({
//         success: false,
//         message: "idNo, semester, and feeCategory are required",
//       });
//     }

//     const pool = await getPool();

//     // Quota is included here because VB auto-fills cmbModeAdmission.Text
//     // from the student's own Admissions.Quota (see Display()) — it is
//     // never something the caller picks separately. An explicit
//     // ?modeOfAdmission= query param still overrides it if you need that.
//     const studentResult = await pool
//       .request()
//       .input("IDNo", sql.BigInt, idNo)
//       .query(`
//         SELECT CollegeName, Course, Batch, Scheme, Quota
//         FROM Admissions
//         WHERE IDNo = @IDNo
//       `);

//     const student = studentResult.recordset[0];
//     if (!student) {
//       return res.status(404).json({ success: false, message: "Student not found" });
//     }

//     const effectiveModeOfAdmission = modeOfAdmission || student.Quota;

//     const request = pool.request()
//       .input("CollegeName", sql.VarChar, student.CollegeName);

//     let onConditions = `
//         MasterHeads.CollegeName = MasterAnnualFee.CollegeName
//         AND MasterHeads.Head = MasterAnnualFee.Head
//         AND MasterAnnualFee.CollegeName = @CollegeName
//     `;

//     if (student.Course) {
//       request.input("Course", sql.VarChar, student.Course);
//       onConditions += ` AND MasterAnnualFee.Course = @Course`;
//     }
//     if (student.Batch) {
//       request.input("Batch", sql.VarChar, String(student.Batch));
//       onConditions += ` AND MasterAnnualFee.Batch = @Batch`;
//     }
//     if (semester) {
//       request.input("Semester", sql.VarChar, semester);
//       onConditions += ` AND MasterAnnualFee.Semester = @Semester`;
//     }
//     if (student.Scheme) {
//       request.input("Scheme", sql.VarChar, student.Scheme);
//       onConditions += ` AND MasterAnnualFee.Scheme = @Scheme`;
//     }
//     if (feeCategory) {
//       request.input("Category", sql.VarChar, feeCategory);
//       onConditions += ` AND MasterAnnualFee.Category = @Category`;
//     }
//     if (effectiveModeOfAdmission) {
//       request.input("ModeOfAdmission", sql.VarChar, effectiveModeOfAdmission);
//       onConditions += ` AND MasterAnnualFee.ModeOfAdmission = @ModeOfAdmission`;
//     }

//     // Plain SELECT — no DISTINCT — so every matching MasterAnnualFee row
//     // survives, including the edge case where two entries for the same
//     // head happen to carry the identical amount (DISTINCT would silently
//     // fold those into one row; this keeps all of them, 2, 3, or more).
//     const sqlQuery = `
//       SELECT
//         MasterHeads.Head,
//         MasterAnnualFee.Amount AS Credit,
//         MasterAnnualFee.Amount AS Debit,
//         MasterHeads.ID
//       FROM MasterHeads
//       LEFT JOIN MasterAnnualFee
//         ON ${onConditions}
//       WHERE MasterHeads.CollegeName = @CollegeName
//       ORDER BY MasterHeads.ID
//     `;

//     if (debug === "true") {
//       console.log("[getFeeHeads] filters:", {
//         CollegeName: student.CollegeName,
//         Course: student.Course,
//         Batch: student.Batch,
//         Semester: semester,
//         Scheme: student.Scheme,
//         Category: feeCategory,
//         ModeOfAdmission: effectiveModeOfAdmission,
//       });
//       console.log("[getFeeHeads] sql:", sqlQuery);

//       // Raw, unfiltered rows for this college — compare their Course /
//       // Batch / Semester / Scheme / Category / ModeOfAdmission values
//       // against the filters logged above to find which column doesn't
//       // match on the row that's going missing.
//       const rawResult = await pool
//         .request()
//         .input("CollegeName", sql.VarChar, student.CollegeName)
//         .query(`
//           SELECT Head, Amount, Course, Batch, Semester, Scheme, Category, ModeOfAdmission
//           FROM MasterAnnualFee
//           WHERE CollegeName = @CollegeName AND Head = 'Academic Fee'
//         `);

//       return res.status(200).json({
//         success: true,
//         filtersUsed: {
//           CollegeName: student.CollegeName,
//           Course: student.Course,
//           Batch: student.Batch,
//           Semester: semester,
//           Scheme: student.Scheme,
//           Category: feeCategory,
//           ModeOfAdmission: effectiveModeOfAdmission,
//         },
//         rawAcademicFeeRows: rawResult.recordset,
//       });
//     }

//     const headsResult = await request.query(sqlQuery);

//     const feeHeads = headsResult.recordset.map((row) => ({
//       id: row.ID,
//       head: row.Head,
//       credit: row.Credit || 0,
//       debit: row.Debit || 0,
//     }));

//     const totalCredit = feeHeads.reduce((sum, h) => sum + h.credit, 0);

//     return res.status(200).json({
//       success: true,
//       feeHeads,
//       totalCredit,
//     });
//   } catch (err) {
//     console.log(err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };


// const getFeeHeads = async (req, res) => {
//   try {
//     const { idNo, semester, feeCategory, modeOfAdmission } = req.query;

//     if (!idNo || !semester || !feeCategory) {
//       return res.status(400).json({
//         success: false,
//         message: "idNo, semester, and feeCategory are required",
//       });
//     }

//     const pool = await getPool();

//     // Get student details
//     const studentResult = await pool
//       .request()
//       .input("IDNo", sql.BigInt, idNo)
//       .query(`
//         SELECT CollegeName, Course, Batch, Scheme, Quota
//         FROM Admissions
//         WHERE IDNo = @IDNo
//       `);

//     const student = studentResult.recordset[0];
//     if (!student) {
//       return res.status(404).json({ success: false, message: "Student not found" });
//     }

//     const effectiveModeOfAdmission = modeOfAdmission || student.Quota;

//     const request = pool.request()
//       .input("CollegeName", sql.VarChar, student.CollegeName);

//     let onConditions = `
//         MasterHeads.CollegeName = MasterAnnualFee.CollegeName
//         AND MasterHeads.Head = MasterAnnualFee.Head
//         AND MasterAnnualFee.CollegeName = @CollegeName
//     `;

//     if (student.Course) {
//       request.input("Course", sql.VarChar, student.Course);
//       onConditions += ` AND MasterAnnualFee.Course = @Course`;
//     }
//     if (student.Batch) {
//       request.input("Batch", sql.VarChar, String(student.Batch));
//       onConditions += ` AND MasterAnnualFee.Batch = @Batch`;
//     }
//     if (semester) {
//       request.input("Semester", sql.VarChar, semester);
//       onConditions += ` AND MasterAnnualFee.Semester = @Semester`;
//     }
//     if (student.Scheme) {
//       request.input("Scheme", sql.VarChar, student.Scheme);
//       onConditions += ` AND MasterAnnualFee.Scheme = @Scheme`;
//     }
//     if (feeCategory) {
//       request.input("Category", sql.VarChar, feeCategory);
//       onConditions += ` AND MasterAnnualFee.Category = @Category`;
//     }
//     if (effectiveModeOfAdmission) {
//       request.input("ModeOfAdmission", sql.VarChar, effectiveModeOfAdmission);
//       onConditions += ` AND MasterAnnualFee.ModeOfAdmission = @ModeOfAdmission`;
//     }

//     // Main query - get fee heads with their amounts
//     const sqlQuery = `
//       SELECT
//         MasterHeads.Head,
//         MasterAnnualFee.Amount AS Credit,
//         MasterAnnualFee.Amount AS Debit,
//         MasterHeads.ID
//       FROM MasterHeads
//       LEFT JOIN MasterAnnualFee
//         ON ${onConditions}
//       WHERE MasterHeads.CollegeName = @CollegeName
//       ORDER BY MasterHeads.ID
//     `;

//     const headsResult = await request.query(sqlQuery);

//     // Map the results
//     const feeHeads = headsResult.recordset.map((row) => ({
//       id: row.ID,
//       head: row.Head,
//       credit: row.Credit || 0,
//       debit: row.Debit || 0,
//     }));

//     // Calculate total
//     const totalCredit = feeHeads.reduce((sum, h) => sum + h.credit, 0);

//     // Return the same structure as the VB.NET DataTable
//     return res.status(200).json({
//       success: true,
//       feeHeads: feeHeads,
//       totalCredit: totalCredit,
//       // Include student data for the UI to auto-fill fields
//       student: {
//         CollegeName: student.CollegeName,
//         Course: student.Course,
//         Batch: student.Batch,
//         Scheme: student.Scheme,
//         Quota: student.Quota
//       }
//     });

//   } catch (err) {
//     console.log(err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };



// const getFeeHeads = async (req, res) => {
//   try {
//     const { idNo, semester, feeCategory, modeOfAdmission } = req.query;

//     if (!idNo || !feeCategory) {
//       return res.status(400).json({
//         success: false,
//         message: "idNo and feeCategory are required",
//       });
//     }

//     const pool = await getPool();

//     // Get student details
//     const studentResult = await pool
//       .request()
//       .input("IDNo", sql.BigInt, idNo)
//       .query(`
//         SELECT CollegeName, Course, Batch, Scheme, Quota
//         FROM Admissions
//         WHERE IDNo = @IDNo
//       `);

//     const student = studentResult.recordset[0];
//     if (!student) {
//       return res.status(404).json({ success: false, message: "Student not found" });
//     }

//     const effectiveModeOfAdmission = modeOfAdmission || student.Quota;

//     const request = pool.request()
//       .input("CollegeName", sql.VarChar, student.CollegeName);

//     // Build WHERE conditions for MasterAnnualFee
//     let whereConditions = `
//         CollegeName = @CollegeName
//     `;

//     if (student.Course) {
//       request.input("Course", sql.VarChar, student.Course);
//       whereConditions += ` AND Course = @Course`;
//     }
//     if (student.Batch) {
//       request.input("Batch", sql.VarChar, String(student.Batch));
//       whereConditions += ` AND Batch = @Batch`;
//     }
//     // Semester is now optional - only add to WHERE if provided
//     if (semester && semester.trim() !== "") {
//       request.input("Semester", sql.VarChar, semester);
//       whereConditions += ` AND Semester = @Semester`;
//     }
//     if (student.Scheme) {
//       request.input("Scheme", sql.VarChar, student.Scheme);
//       whereConditions += ` AND Scheme = @Scheme`;
//     }
//     if (feeCategory) {
//       request.input("Category", sql.VarChar, feeCategory);
//       whereConditions += ` AND Category = @Category`;
//     }
//     if (effectiveModeOfAdmission) {
//       request.input("ModeOfAdmission", sql.VarChar, effectiveModeOfAdmission);
//       whereConditions += ` AND ModeOfAdmission = @ModeOfAdmission`;
//     }

//     // Query directly from MasterAnnualFee to get ALL records
//     // Try ordering by Head first, then Amount to group similar items
//     const sqlQuery = `
//       SELECT 
//         Head,
//         Amount AS Credit,
//         Amount AS Debit
//       FROM MasterAnnualFee
//       WHERE ${whereConditions}
//       ORDER BY Head, Amount
//     `;

//     console.log("SQL Query:", sqlQuery);
//     console.log("Parameters:", {
//       CollegeName: student.CollegeName,
//       Course: student.Course,
//       Batch: student.Batch,
//       Semester: semester || "NOT PROVIDED",
//       Scheme: student.Scheme,
//       Category: feeCategory,
//       ModeOfAdmission: effectiveModeOfAdmission
//     });

//     const result = await request.query(sqlQuery);

//     // Map the results - this will show ALL entries including duplicate heads
//     const feeHeads = result.recordset.map((row) => ({
//       head: row.Head,
//       credit: row.Credit || 0,
//       debit: row.Debit || 0,
//     }));

//     // Calculate total
//     const totalCredit = feeHeads.reduce((sum, h) => sum + h.credit, 0);

//     return res.status(200).json({
//       success: true,
//       feeHeads: feeHeads,
//       totalCredit: totalCredit,
//       // Include student data for the UI to auto-fill fields
//       student: {
//         CollegeName: student.CollegeName,
//         Course: student.Course,
//         Batch: student.Batch,
//         Scheme: student.Scheme,
//         Quota: student.Quota
//       }
//     });

//   } catch (err) {
//     console.log(err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };



const getFeeHeads = async (req, res) => {
  try {
    const { idNo, semester, feeCategory, modeOfAdmission } = req.query;

    if (!idNo || !feeCategory) {
      return res.status(400).json({
        success: false,
        message: "idNo and feeCategory are required",
      });
    }

    const pool = await getPool();

    // Get student details
    const studentResult = await pool
      .request()
      .input("IDNo", sql.BigInt, idNo)
      .query(`
        SELECT CollegeName, Course, Batch, Scheme, Quota
        FROM Admissions
        WHERE IDNo = @IDNo
      `);

    const student = studentResult.recordset[0];
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const effectiveModeOfAdmission = modeOfAdmission || student.Quota;

    const request = pool.request()
      .input("CollegeName", sql.VarChar, student.CollegeName);

    // Build the LEFT JOIN conditions (matching VB.NET ShowDebits())
    let joinConditions = `
        MasterHeads.CollegeName = MasterAnnualFee.CollegeName
        AND MasterHeads.Head = MasterAnnualFee.Head
        AND MasterAnnualFee.CollegeName = @CollegeName
    `;

    // Add filters to the JOIN conditions (not WHERE)
    if (student.Course) {
      request.input("Course", sql.VarChar, student.Course);
      joinConditions += ` AND MasterAnnualFee.Course = @Course`;
    }
    if (student.Batch) {
      request.input("Batch", sql.VarChar, String(student.Batch));
      joinConditions += ` AND MasterAnnualFee.Batch = @Batch`;
    }
    // Semester is optional - only add if provided
    if (semester && semester.trim() !== "") {
      request.input("Semester", sql.VarChar, semester);
      joinConditions += ` AND MasterAnnualFee.Semester = @Semester`;
    }
    if (student.Scheme) {
      request.input("Scheme", sql.VarChar, student.Scheme);
      joinConditions += ` AND MasterAnnualFee.Scheme = @Scheme`;
    }
    if (feeCategory) {
      request.input("Category", sql.VarChar, feeCategory);
      joinConditions += ` AND MasterAnnualFee.Category = @Category`;
    }
    if (effectiveModeOfAdmission) {
      request.input("ModeOfAdmission", sql.VarChar, effectiveModeOfAdmission);
      joinConditions += ` AND MasterAnnualFee.ModeOfAdmission = @ModeOfAdmission`;
    }

    // This matches the VB.NET query exactly - LEFT JOIN with MasterHeads
    const sqlQuery = `
      SELECT DISTINCT 
        MasterHeads.Head,
        ISNULL(MasterAnnualFee.Amount, 0) AS Credit,
        ISNULL(MasterAnnualFee.Amount, 0) AS Debit,
        MasterHeads.ID
      FROM MasterHeads
      LEFT JOIN MasterAnnualFee
        ON ${joinConditions}
      WHERE MasterHeads.CollegeName = @CollegeName
      ORDER BY MasterHeads.ID
    `;

    console.log("SQL Query:", sqlQuery);
    console.log("Parameters:", {
      CollegeName: student.CollegeName,
      Course: student.Course,
      Batch: student.Batch,
      Semester: semester || "NOT PROVIDED",
      Scheme: student.Scheme,
      Category: feeCategory,
      ModeOfAdmission: effectiveModeOfAdmission
    });

    const result = await request.query(sqlQuery);

    // Map the results - this will show ALL heads from MasterHeads
    // with amounts from MasterAnnualFee (0 if no match)
    const feeHeads = result.recordset.map((row) => ({
      head: row.Head,
      credit: row.Credit || 0,
      debit: row.Debit || 0,
      id: row.ID
    }));

    // Calculate total
    const totalCredit = feeHeads.reduce((sum, h) => sum + h.credit, 0);

    return res.status(200).json({
      success: true,
      feeHeads: feeHeads,
      totalCredit: totalCredit,
      student: {
        CollegeName: student.CollegeName,
        Course: student.Course,
        Batch: student.Batch,
        Scheme: student.Scheme,
        Quota: student.Quota
      }
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Fires when Student's type = Old and an ID No. is entered — mirrors VB's
 * txtIDNo_Leave calling Display() to fill the whole Student detail panel.
 */
const findStudent = async (req, res) => {
  try {
    const { idNo } = req.params;
    const student = await getStudentByIdNo(idNo);

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Attach the student's current semester (MasterCurrentSemester),
    // since Admissions itself doesn't track a live semester value.
    const currentSemester = await getCurrentSemester(
      student.CollegeName,
      student.Course,
      student.Batch
    );

    return res.status(200).json({
      success: true,
      student: { ...student, Semester: currentSemester },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


const getCurrentSemester = async (collegeName, course, batch) => {
  const pool = await getPool();
  const request = pool.request();

  let query = `
    SELECT TOP 1 Semester FROM MasterCurrentSemester
    WHERE CollegeName = @CollegeName AND Course = @Course
  `;
  request.input("CollegeName", sql.NVarChar, collegeName);
  request.input("Course", sql.NVarChar, course);

  if (batch) {
    query += ` AND Batch = @Batch`;
    request.input("Batch", sql.Int, batch);
  }

  const result = await request.query(query);
  return result.recordset[0]?.Semester || null;
};



/**
 * btnAdd_Click — validates the same fields VB checked (ID No., Ledger,
 * Debit amount), creates the student first if Student's type = New, applies
 * any ticked facility-detail fields, then inserts the Debit entry.
 */
const saveDebit = async (req, res) => {
  try {
    const { idNo } = req.params;
    const body = req.body;

    if (!idNo) {
      return res.status(400).json({ success: false, message: "ID No. is required" });
    }
    if (!body.ledgerName) {
      return res.status(400).json({ success: false, message: "Please select a Ledger" });
    }
    if (body.ledgerName === "Others" && !body.othersLedgerName) {
      return res.status(400).json({ success: false, message: "Please select an Others ledger" });
    }
    if (!body.debit || Number(body.debit) <= 0) {
      return res.status(400).json({ success: false, message: "Invalid Debit Amount" });
    }

    const pool = await getPool();

    // Convert idNo to number
    const idNoNumber = parseFloat(idNo); // Using parseFloat because IDNo in Ledger is FLOAT!
    if (isNaN(idNoNumber)) {
      return res.status(400).json({ success: false, message: "Invalid ID No. format" });
    }

    // Get student details
    let student;
    if (body.studentType === "New") {
      // Check if ID exists - Admissions uses bigint
      const checkResult = await pool
        .request()
        .input("IDNo", sql.BigInt, idNoNumber)
        .query("SELECT IDNo FROM Admissions WHERE IDNo = @IDNo");
      
      if (checkResult.recordset.length > 0) {
        return res.status(400).json({ success: false, message: "ID No. already exists — use Student's type: Old" });
      }
      
      // Insert new student - Admissions uses bigint for IDNo
      await pool
        .request()
        .input("IDNo", sql.BigInt, idNoNumber)
        .input("CollegeName", sql.VarChar, body.studentDetail.collegeName || "")
        .input("StudentName", sql.VarChar, body.studentDetail.studentName || "")
        .input("FatherName", sql.VarChar, body.studentDetail.fatherName || "")
        .input("MotherName", sql.VarChar, body.studentDetail.motherName || "")
        .input("Course", sql.VarChar, body.studentDetail.course || "")
        .input("Batch", sql.Int, parseInt(body.studentDetail.batch) || 0)
        .input("Class", sql.VarChar, body.studentDetail.studentClass || "")
        .input("ClassRollNo", sql.VarChar, body.studentDetail.classRollNo || "")
        .input("UniRollNo", sql.VarChar, body.studentDetail.uniRollNo || "")
        .input("Scheme", sql.VarChar, body.studentDetail.scheme || "")
        .input("DOB", sql.VarChar, body.studentDetail.dob || "")
        .input("Sex", sql.VarChar, body.studentDetail.sex || "")
        .input("PermanentAddress", sql.VarChar, body.studentDetail.permanentAddress || "")
        .input("PhoneNo", sql.VarChar, body.studentDetail.phoneNo || "")
        .input("StudentMobileNo", sql.VarChar, body.studentDetail.studentMobile || "")
        .input("FatherMobileNo", sql.VarChar, body.studentDetail.fatherMobile || "")
        .input("MotherMobileNo", sql.VarChar, body.studentDetail.motherMobile || "")
        .input("LateralEntry", sql.VarChar, body.studentDetail.lateralEntry ? "Yes" : "No")
        .input("StudentType", sql.VarChar, "New")
        .query(`
          INSERT INTO Admissions (
            IDNo, CollegeName, StudentName, FatherName, MotherName, 
            Course, Batch, Class, ClassRollNo, UniRollNo, 
            Scheme, DOB, Sex, PermanentAddress, PhoneNo,
            StudentMobileNo, FatherMobileNo, MotherMobileNo,
            LateralEntry, StudentType
          ) VALUES (
            @IDNo, @CollegeName, @StudentName, @FatherName, @MotherName,
            @Course, @Batch, @Class, @ClassRollNo, @UniRollNo,
            @Scheme, @DOB, @Sex, @PermanentAddress, @PhoneNo,
            @StudentMobileNo, @FatherMobileNo, @MotherMobileNo,
            @LateralEntry, @StudentType
          )
        `);
      
      // Get the newly created student
      const newStudent = await pool
        .request()
        .input("IDNo", sql.BigInt, idNoNumber)
        .query("SELECT * FROM Admissions WHERE IDNo = @IDNo");
      
      student = newStudent.recordset[0];
    } else {
      // Get existing student - Admissions uses bigint
      const studentResult = await pool
        .request()
        .input("IDNo", sql.BigInt, idNoNumber)
        .query(`
          SELECT IDNo, CollegeName, StudentName, FatherName, Course, 
                 Batch, Class, ClassRollNo, UniRollNo, Scheme,
                 Category, Quota, Sex, HostelCharges, BusFee,
                 HostelName, RoomType, BusRoute, Stopage
          FROM Admissions 
          WHERE IDNo = @IDNo
        `);
      
      if (studentResult.recordset.length === 0) {
        return res.status(404).json({ success: false, message: "No student found with this ID No." });
      }
      student = studentResult.recordset[0];
    }

    // Update facility if provided
    if (body.facility && (body.facility.hostelName || body.facility.roomType || body.facility.route || body.facility.stopage)) {
      const updateFacility = pool.request().input("IDNo", sql.BigInt, idNoNumber);
      let updateFields = [];
      
      if (body.facility.hostelName) {
        updateFields.push("HostelName = @HostelName");
        updateFacility.input("HostelName", sql.VarChar, body.facility.hostelName);
      }
      if (body.facility.roomType) {
        updateFields.push("RoomType = @RoomType");
        updateFacility.input("RoomType", sql.VarChar, body.facility.roomType);
      }
      if (body.facility.route) {
        updateFields.push("BusRoute = @BusRoute");
        updateFacility.input("BusRoute", sql.VarChar, body.facility.route);
      }
      if (body.facility.stopage) {
        updateFields.push("Stopage = @Stopage");
        updateFacility.input("Stopage", sql.VarChar, body.facility.stopage);
      }
      if (body.facility.amount) {
        if (body.facility.hostelName || body.facility.roomType) {
          updateFields.push("HostelCharges = @HostelCharges");
          updateFacility.input("HostelCharges", sql.Int, parseInt(body.facility.amount) || 0);
        } else if (body.facility.route || body.facility.stopage) {
          updateFields.push("BusFee = @BusFee");
          updateFacility.input("BusFee", sql.Int, parseInt(body.facility.amount) || 0);
        }
      }
      
      if (updateFields.length > 0) {
        await updateFacility.query(`
          UPDATE Admissions 
          SET ${updateFields.join(", ")} 
          WHERE IDNo = @IDNo
        `);
      }
    }

    // Get SemesterID
    const semesterMap = {
      "Semester 1": 1, "Semester 2": 2, "Semester 3": 3,
      "Semester 4": 4, "Semester 5": 5, "Semester 6": 6,
      "Semester 7": 7, "Semester 8": 8,
      "First": 1, "Second": 2, "Third": 3,
      "Fourth": 4, "Fifth": 5, "Sixth": 6,
      "Seventh": 7, "Eight": 8
    };
    const semesterID = semesterMap[body.semester] || 0;

    // Generate TransactionID - Ledger uses bigint
    const transIdResult = await pool
      .request()
      .input("CollegeName", sql.VarChar, student.CollegeName)
      .query(`
        SELECT ISNULL(MAX(TransactionID), 0) + 1 AS NewTransactionID
        FROM Ledger
        WHERE CollegeName = @CollegeName
      `);
    const transactionID = transIdResult.recordset[0].NewTransactionID || 1;

    // Determine debit amount for Fee ledger
    let debitAmount = parseFloat(body.debit) || 0;
    let feeHeads = [];

    if (body.ledgerName === "Fee" && body.feeHeads && body.feeHeads.length > 0) {
      feeHeads = body.feeHeads;
      debitAmount = feeHeads.reduce((sum, fh) => sum + (parseFloat(fh.credit) || 0), 0);
    }

    // Get the ledger name
    const ledgerName = body.ledgerName === "Others" ? body.othersLedgerName : body.ledgerName;

    // Insert into Ledger - IDNo is FLOAT in Ledger!
    await pool
      .request()
      .input("IDNo", sql.Float, idNoNumber)  // IMPORTANT: IDNo is FLOAT in Ledger!
      .input("CollegeName", sql.VarChar, student.CollegeName)
      .input("StudentName", sql.VarChar, student.StudentName)
      .input("FatherName", sql.VarChar, student.FatherName)
      .input("Course", sql.VarChar, student.Course)
      .input("Batch", sql.Int, parseInt(student.Batch) || 0)
      .input("Class", sql.VarChar, student.Class || "")
      .input("ClassRollNo", sql.VarChar, student.ClassRollNo || "")
      .input("UniRollNo", sql.VarChar, student.UniRollNo || "")
      .input("DateEntry", sql.DateTime, body.dateEntry ? new Date(body.dateEntry) : new Date())
      .input("Semester", sql.VarChar, body.semester || "")
      .input("SemesterID", sql.Int, semesterID)
      .input("Scheme", sql.VarChar, student.Scheme || "")
      .input("Category", sql.VarChar, body.category || student.Category || "")
      .input("ModeOfAdmission", sql.VarChar, body.modeOfAdmission || student.Quota || "")
      .input("Sex", sql.VarChar, student.Sex || "")
      .input("Debit", sql.Int, parseInt(debitAmount) || 0)  // Debit is INT in Ledger
      .input("TransactionType", sql.VarChar, "Debit")
      .input("Particulars", sql.VarChar, body.particulars || "")
      .input("LedgerName", sql.VarChar, ledgerName)
      .input("OnAccountOf", sql.VarChar, body.particulars || "")
      .input("ConcessionEntry", sql.VarChar, body.concessionEntry || "No")
      .input("Refund", sql.VarChar, body.refundEntry || "No")
      .input("TransactionID", sql.BigInt, transactionID)  // TransactionID is BIGINT in Ledger
      .input("Session", sql.VarChar, body.session || "")
      .input("UserID", sql.BigInt, parseInt(body.userId) || 1)  // UserID is BIGINT in Ledger
      .input("Remarks", sql.VarChar, body.remarks || "")
      .query(`
        INSERT INTO Ledger (
          IDNo, CollegeName, StudentName, FatherName, Course, Batch, Class,
          ClassRollNo, UniRollNo, DateEntry, Semester, SemesterID, Scheme,
          Category, ModeOfAdmission, Sex, Debit, TransactionType, Particulars,
          LedgerName, OnAccountOf, ConcessionEntry, Refund, TransactionID,
          Session, UserID, Remarks
        ) VALUES (
          @IDNo, @CollegeName, @StudentName, @FatherName, @Course, @Batch, @Class,
          @ClassRollNo, @UniRollNo, @DateEntry, @Semester, @SemesterID, @Scheme,
          @Category, @ModeOfAdmission, @Sex, @Debit, @TransactionType, @Particulars,
          @LedgerName, @OnAccountOf, @ConcessionEntry, @Refund, @TransactionID,
          @Session, @UserID, @Remarks
        )
      `);

    // If Fee ledger, insert SubLedgers - NO IDNo column in SubLedgers!
    if (body.ledgerName === "Fee" && feeHeads.length > 0) {
      const userIdNumber = parseInt(body.userId) || 1;
      
      for (const fh of feeHeads) {
        const amount = parseInt(fh.credit) || 0;
        if (amount > 0) {
          await pool
            .request()
            .input("Session", sql.VarChar, body.session || "")
            .input("CollegeName", sql.VarChar, student.CollegeName)
            .input("TransactionType", sql.VarChar, "Debit")
            .input("TransactionID", sql.BigInt, transactionID)  // TransactionID is BIGINT
            .input("LedgerName", sql.VarChar, "Fee")
            .input("ReceiptNo", sql.Int, 0)  // ReceiptNo is INT
            .input("Subhead", sql.VarChar, fh.head)
            .input("Debit", sql.Int, amount)  // Debit is INT
            .input("Credit", sql.Int, 0)  // Credit is INT
            .input("UserID", sql.BigInt, userIdNumber)  // UserID is BIGINT
            .query(`
              INSERT INTO SubLedgers (
                Session, CollegeName, TransactionType, TransactionID,
                LedgerName, ReceiptNo, Subhead, Debit, Credit, UserID
              ) VALUES (
                @Session, @CollegeName, @TransactionType, @TransactionID,
                @LedgerName, @ReceiptNo, @Subhead, @Debit, @Credit, @UserID
              )
            `);
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Entry has been Saved Successfully",
      receiptNo: 0,
      transactionId: transactionID,
    });

  } catch (err) {
    console.error("Error saving debit entry:", err);
    return res.status(500).json({ 
      success: false, 
      message: err.message || "Failed to save entry" 
    });
  }
};

/**
 * Populates every dropdown on the page in one call — Ledgers > Others,
 * Update Facility Detail (Hostel Name / Room Type / Route / Stopage), and
 * the Debit panel's All Category / All Mode of Admission.
 */
const getMetaOptions = async (req, res) => {
  try {
    const { collegeName, route } = req.query;
    if (!collegeName) {
      return res.status(400).json({ success: false, message: "collegeName is required" });
    }

    const [hostelNames, roomTypes, routes, stopages, categories, modesOfAdmission, currentSession] =
      await Promise.all([
        getHostelNames(collegeName),
        getRoomTypes(),
        getRoutes(collegeName),
        route ? getStopages(route) : Promise.resolve([]),
        getCategories(collegeName),
        getModesOfAdmission(),
        getCurrentMasterSession(),
      ]);

    return res.status(200).json({
      success: true,
      hostelNames,
      roomTypes,
      routes,
      stopages,
      categories,
      modesOfAdmission,
      currentSession,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


module.exports = {
  findStudent,
  saveDebit,
  getMetaOptions,
  getFeeHeads,
  
};