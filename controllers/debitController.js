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

const getFeeHeads = async (req, res) => {
  try {
    const { idNo, semester, feeCategory, modeOfAdmission, debug } = req.query;

    if (!idNo || !semester || !feeCategory) {
      return res.status(400).json({
        success: false,
        message: "idNo, semester, and feeCategory are required",
      });
    }

    const pool = await getPool();

    // Quota is included here because VB auto-fills cmbModeAdmission.Text
    // from the student's own Admissions.Quota (see Display()) — it is
    // never something the caller picks separately. An explicit
    // ?modeOfAdmission= query param still overrides it if you need that.
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

    let onConditions = `
        MasterHeads.CollegeName = MasterAnnualFee.CollegeName
        AND MasterHeads.Head = MasterAnnualFee.Head
        AND MasterAnnualFee.CollegeName = @CollegeName
    `;

    if (student.Course) {
      request.input("Course", sql.VarChar, student.Course);
      onConditions += ` AND MasterAnnualFee.Course = @Course`;
    }
    if (student.Batch) {
      request.input("Batch", sql.VarChar, String(student.Batch));
      onConditions += ` AND MasterAnnualFee.Batch = @Batch`;
    }
    if (semester) {
      request.input("Semester", sql.VarChar, semester);
      onConditions += ` AND MasterAnnualFee.Semester = @Semester`;
    }
    if (student.Scheme) {
      request.input("Scheme", sql.VarChar, student.Scheme);
      onConditions += ` AND MasterAnnualFee.Scheme = @Scheme`;
    }
    if (feeCategory) {
      request.input("Category", sql.VarChar, feeCategory);
      onConditions += ` AND MasterAnnualFee.Category = @Category`;
    }
    if (effectiveModeOfAdmission) {
      request.input("ModeOfAdmission", sql.VarChar, effectiveModeOfAdmission);
      onConditions += ` AND MasterAnnualFee.ModeOfAdmission = @ModeOfAdmission`;
    }

    // Plain SELECT — no DISTINCT — so every matching MasterAnnualFee row
    // survives, including the edge case where two entries for the same
    // head happen to carry the identical amount (DISTINCT would silently
    // fold those into one row; this keeps all of them, 2, 3, or more).
    const sqlQuery = `
      SELECT
        MasterHeads.Head,
        MasterAnnualFee.Amount AS Credit,
        MasterAnnualFee.Amount AS Debit,
        MasterHeads.ID
      FROM MasterHeads
      LEFT JOIN MasterAnnualFee
        ON ${onConditions}
      WHERE MasterHeads.CollegeName = @CollegeName
      ORDER BY MasterHeads.ID
    `;

    if (debug === "true") {
      console.log("[getFeeHeads] filters:", {
        CollegeName: student.CollegeName,
        Course: student.Course,
        Batch: student.Batch,
        Semester: semester,
        Scheme: student.Scheme,
        Category: feeCategory,
        ModeOfAdmission: effectiveModeOfAdmission,
      });
      console.log("[getFeeHeads] sql:", sqlQuery);

      // Raw, unfiltered rows for this college — compare their Course /
      // Batch / Semester / Scheme / Category / ModeOfAdmission values
      // against the filters logged above to find which column doesn't
      // match on the row that's going missing.
      const rawResult = await pool
        .request()
        .input("CollegeName", sql.VarChar, student.CollegeName)
        .query(`
          SELECT Head, Amount, Course, Batch, Semester, Scheme, Category, ModeOfAdmission
          FROM MasterAnnualFee
          WHERE CollegeName = @CollegeName AND Head = 'Academic Fee'
        `);

      return res.status(200).json({
        success: true,
        filtersUsed: {
          CollegeName: student.CollegeName,
          Course: student.Course,
          Batch: student.Batch,
          Semester: semester,
          Scheme: student.Scheme,
          Category: feeCategory,
          ModeOfAdmission: effectiveModeOfAdmission,
        },
        rawAcademicFeeRows: rawResult.recordset,
      });
    }

    const headsResult = await request.query(sqlQuery);

    const feeHeads = headsResult.recordset.map((row) => ({
      id: row.ID,
      head: row.Head,
      credit: row.Credit || 0,
      debit: row.Debit || 0,
    }));

    const totalCredit = feeHeads.reduce((sum, h) => sum + h.credit, 0);

    return res.status(200).json({
      success: true,
      feeHeads,
      totalCredit,
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

    let student;
    if (body.studentType === "New") {
      student = await getStudentByIdNo(idNo);
      if (student) {
        return res.status(400).json({ success: false, message: "ID No. already exists — use Student's type: Old" });
      }
      await createStudent({ idNo, ...body.studentDetail }, null);
      student = await getStudentByIdNo(idNo);
    } else {
      student = await getStudentByIdNo(idNo);
      if (!student) {
        return res.status(404).json({ success: false, message: "No student found with this ID No." });
      }
    }

    if (body.facility && (body.facility.hostelName || body.facility.roomType || body.facility.route || body.facility.stopage)) {
      await updateFacilityDetail(idNo, body.facility, null);
    }

    const { receiptNo, transactionId } = await saveDebitEntry({
      idNo,
      collegeName: student.CollegeName,
      studentName: student.StudentName,
      fatherName: student.FatherName,
      course: student.Course,
      studentClass: student.Class,
      batch: student.Batch,
      classRollNo: student.ClassRollNo,
      uniRollNo: student.UniRollNo,
      session: body.session,
      semester: body.semester,
      category: body.category,
      modeOfAdmission: body.modeOfAdmission,
      ledgerName: body.ledgerName,
      othersLedgerName: body.othersLedgerName,
      facilityAmount: body.facility?.amount || null,
      refundEntry: body.refundEntry,
      concessionEntry: body.concessionEntry,
      particulars: body.particulars,
      debit: body.debit,
      remarks: body.remarks,
      userId: req.user?.id || body.userId || null,
      dateEntry: body.dateEntry ? new Date(body.dateEntry) : new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Entry has been Saved Successfully",
      receiptNo,
      transactionId,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
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