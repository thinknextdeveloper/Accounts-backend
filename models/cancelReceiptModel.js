// const { sql, getPool } = require("../config/db");

// const getColleges = async () => {
//   const pool = await getPool();
//   const result = await pool.request().query(`
//     SELECT DISTINCT CollegeName FROM MasterCollege ORDER BY CollegeName
//   `);
//   return result.recordset.map((r) => r.CollegeName);
// };

// const getLedgerNames = async () => {
//   const pool = await getPool();
//   const result = await pool.request().query(`
//     SELECT DISTINCT LedgerName FROM Ledger WHERE LedgerName IS NOT NULL ORDER BY LedgerName
//   `);
//   return result.recordset.map((r) => r.LedgerName);
// };

// /**
//  * Finds the Ledger receipt(s) matching College + Ledger Name + Session +
//  * Receipt No, for the "Search" button's top grid. Excludes rows already
//  * cancelled (ASSUMPTION: Ledger has an IsCancelled column — add it via
//  * migration if it doesn't exist yet: ALTER TABLE Ledger ADD IsCancelled
//  * NVARCHAR(3) DEFAULT 'No').
//  */
// const searchReceipt = async ({ collegeName, ledgerName, session, receiptNo }) => {
//   const pool = await getPool();
//   const request = pool.request();

//   let query = `
//     SELECT
//       TransactionID, ReceiptNo, DateEntry, IDNo, StudentName, FatherName,
//       Course, Batch, Semester, LedgerName, Credit, ModeOfPayment,
//       CollegeName, Session, ISNULL(IsCancelled, 'No') AS IsCancelled
//     FROM Ledger
//     WHERE CollegeName = @CollegeName AND TransactionType = 'Credit'
//   `;
//   request.input("CollegeName", sql.NVarChar, collegeName);

//   if (ledgerName) {
//     query += ` AND LedgerName = @LedgerName`;
//     request.input("LedgerName", sql.NVarChar, ledgerName);
//   }
//   if (session) {
//     query += ` AND Session = @Session`;
//     request.input("Session", sql.NVarChar, session);
//   }
//   if (receiptNo) {
//     query += ` AND ReceiptNo = @ReceiptNo`;
//     request.input("ReceiptNo", sql.Int, receiptNo);
//   }

//   query += ` ORDER BY DateEntry DESC`;

//   const result = await request.query(query);
//   return result.recordset;
// };

// /**
//  * Marks a receipt as cancelled: inserts an audit row into CancelledReceipts
//  * (ASSUMPTION: table doesn't exist yet — create it, see SQL below) and
//  * flags the source Ledger row so it's excluded from future searches/day
//  * book totals if you choose to filter on IsCancelled elsewhere.
//  *
//  * CREATE TABLE CancelledReceipts (
//  *   Id INT IDENTITY PRIMARY KEY,
//  *   TransactionID INT NOT NULL,
//  *   ReceiptNo INT NOT NULL,
//  *   CollegeName NVARCHAR(200) NOT NULL,
//  *   LedgerName NVARCHAR(100) NULL,
//  *   Session NVARCHAR(20) NULL,
//  *   IDNo BIGINT NULL,
//  *   StudentName NVARCHAR(200) NULL,
//  *   Credit DECIMAL(18,2) NULL,
//  *   Comments NVARCHAR(500) NOT NULL,
//  *   CancelledDate DATETIME NOT NULL DEFAULT GETDATE(),
//  *   CancelledBy NVARCHAR(100) NULL
//  * );
//  */
// const addCancelledReceipt = async ({
//   transactionId,
//   receiptNo,
//   collegeName,
//   ledgerName,
//   session,
//   idNo,
//   studentName,
//   credit,
//   comments,
//   cancelledBy,
// }) => {
//   const pool = await getPool();
//   const transaction = new sql.Transaction(pool);

//   try {
//     await transaction.begin();

//     const insertRequest = transaction.request();
//     insertRequest
//       .input("TransactionID", sql.Int, transactionId)
//       .input("ReceiptNo", sql.Int, receiptNo)
//       .input("CollegeName", sql.NVarChar, collegeName)
//       .input("LedgerName", sql.NVarChar, ledgerName || null)
//       .input("Session", sql.NVarChar, session || null)
//       .input("IDNo", sql.BigInt, idNo || null)
//       .input("StudentName", sql.NVarChar, studentName || null)
//       .input("Credit", sql.Decimal(18, 2), credit || null)
//       .input("Comments", sql.NVarChar, comments)
//       .input("CancelledBy", sql.NVarChar, cancelledBy || null);

//     await insertRequest.query(`
//       INSERT INTO CancelledReceipts
//         (TransactionID, ReceiptNo, CollegeName, LedgerName, Session, IDNo, StudentName, Credit, Comments, CancelledBy)
//       VALUES
//         (@TransactionID, @ReceiptNo, @CollegeName, @LedgerName, @Session, @IDNo, @StudentName, @Credit, @Comments, @CancelledBy)
//     `);

//     const updateRequest = transaction.request();
//     updateRequest.input("TransactionID", sql.Int, transactionId);
//     await updateRequest.query(`
//       UPDATE Ledger SET IsCancelled = 'Yes' WHERE TransactionID = @TransactionID
//     `);

//     await transaction.commit();
//     return { success: true };
//   } catch (err) {
//     await transaction.rollback();
//     throw err;
//   }
// };

// /**
//  * Lists cancelled receipts for a college within a date range — feeds the
//  * bottom grid + Print button.
//  */
// const getCancelledReceipts = async ({ collegeName, dateFrom, dateTo }) => {
//   const pool = await getPool();
//   const request = pool.request();

//   let query = `
//     SELECT
//       Id, TransactionID, ReceiptNo, CollegeName, LedgerName, Session,
//       IDNo, StudentName, Credit, Comments, CancelledDate, CancelledBy
//     FROM CancelledReceipts
//     WHERE 1 = 1
//   `;

//   if (collegeName) {
//     query += ` AND CollegeName = @CollegeName`;
//     request.input("CollegeName", sql.NVarChar, collegeName);
//   }
//   if (dateFrom && dateTo) {
//     query += ` AND CancelledDate BETWEEN @DateFrom AND @DateTo`;
//     request.input("DateFrom", sql.DateTime, dateFrom);
//     request.input("DateTo", sql.DateTime, dateTo);
//   }

//   query += ` ORDER BY CancelledDate DESC`;

//   const result = await request.query(query);
//   return result.recordset;
// };

// module.exports = {
//   getColleges,
//   getLedgerNames,
//   searchReceipt,
//   addCancelledReceipt,
//   getCancelledReceipts,
// };

const { sql, getPool } = require("../config/db");

const getColleges = async () => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT DISTINCT CollegeName FROM MasterCollege ORDER BY CollegeName
  `);
  return result.recordset.map((r) => r.CollegeName);
};

// Mirrors VB ShowLedgerName(): distinct LedgerName from MasterLedgers,
// scoped to the selected college.
const getLedgerNames = async (collegeName) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("CollegeName", sql.NVarChar, collegeName)
    .query(`
      SELECT DISTINCT LedgerName FROM MasterLedgers
      WHERE CollegeName = @CollegeName
      ORDER BY LedgerName
    `);
  return result.recordset.map((r) => r.LedgerName);
};

// Mirrors VB btnSearch_Click: exact match on College + LedgerName + Session
// + ReceiptNo, no TransactionType filter — returns whatever Ledger row(s)
// match (normally one).
const searchReceipt = async ({ collegeName, ledgerName, session, receiptNo }) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("CollegeName", sql.NVarChar, collegeName)
    .input("LedgerName", sql.NVarChar, ledgerName)
    .input("Session", sql.NVarChar, session)
    .input("ReceiptNo", sql.Int, receiptNo)
    .query(`
      SELECT * FROM Ledger
      WHERE CollegeName = @CollegeName
        AND LedgerName = @LedgerName
        AND Session = @Session
        AND ReceiptNo = @ReceiptNo
    `);
  return result.recordset;
};

/**
 * Mirrors VB btnAddCancelReceipt_Click:
 *  1. Re-fetch the Ledger row(s) matching the same 4-field criteria.
 *  2. Insert the first matching row into CancelledReceipt (now including
 *     Comments, which VB captured but never actually persisted).
 *  3. Fetch matching SubLedgers rows and insert each into
 *     CancelledReceiptHeads.
 *  4. Delete the matching rows from Ledger and SubLedgers.
 * All wrapped in one transaction (VB ran these as separate un-transacted
 * commands — wrapping them here protects against a partial cancel if
 * something fails midway).
 */
const addCancelledReceipt = async ({
  collegeName,
  ledgerName,
  session,
  receiptNo,
  comments,
  userId,
}) => {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const ledgerRequest = transaction.request();
    ledgerRequest
      .input("CollegeName", sql.NVarChar, collegeName)
      .input("LedgerName", sql.NVarChar, ledgerName)
      .input("Session", sql.NVarChar, session)
      .input("ReceiptNo", sql.Int, receiptNo);

    const ledgerResult = await ledgerRequest.query(`
      SELECT * FROM Ledger
      WHERE CollegeName = @CollegeName
        AND LedgerName = @LedgerName
        AND Session = @Session
        AND ReceiptNo = @ReceiptNo
    `);

    if (ledgerResult.recordset.length === 0) {
      await transaction.rollback();
      return { success: false, message: "No Record Found" };
    }

    const row = ledgerResult.recordset[0];

    const insertRequest = transaction.request();
    insertRequest
      .input("CollegeName", sql.NVarChar, row.CollegeName ?? null)
      .input("DateEntry", sql.DateTime, row.DateEntry ?? null)
      .input("IDNo", sql.BigInt, row.IDNo ?? null)
      .input("StudentName", sql.NVarChar, row.StudentName ?? null)
      .input("FatherName", sql.NVarChar, row.FatherName ?? null)
      .input("ReceiptNo", sql.Int, row.ReceiptNo ?? null)
      .input("Particulars", sql.NVarChar, row.Particulars ?? null)
      .input("Debit", sql.Decimal(18, 2), row.Debit ?? null)
      .input("Credit", sql.Decimal(18, 2), row.Credit ?? null)
      .input("LedgerName", sql.NVarChar, row.LedgerName ?? null)
      .input("ModeOfPayment", sql.NVarChar, row.ModeOfPayment ?? null)
      .input("ChequeDraftDate", sql.DateTime, row.ChequeDraftDate ?? null)
      .input("ChequeDraftNo", sql.NVarChar, row.ChequeDraftNo ?? null)
      .input("ChequeDraftBank", sql.NVarChar, row.ChequeDraftBank ?? null)
      .input("Session", sql.NVarChar, row.Session ?? null)
      .input("UserID", sql.NVarChar, userId || null)
      .input("Comments", sql.NVarChar, comments);

    await insertRequest.query(`
      INSERT INTO CancelledReceipt
        (CollegeName, DateEntry, IDNo, StudentName, FatherName, ReceiptNo,
         Particulars, Debit, Credit, LedgerName, ModeOfPayment,
         ChequeDraftDate, ChequeDraftNo, ChequeDraftBank, Session, UserID, Comments)
      VALUES
        (@CollegeName, @DateEntry, @IDNo, @StudentName, @FatherName, @ReceiptNo,
         @Particulars, @Debit, @Credit, @LedgerName, @ModeOfPayment,
         @ChequeDraftDate, @ChequeDraftNo, @ChequeDraftBank, @Session, @UserID, @Comments)
    `);

    const subRequest = transaction.request();
    subRequest
      .input("CollegeName", sql.NVarChar, collegeName)
      .input("LedgerName", sql.NVarChar, ledgerName)
      .input("Session", sql.NVarChar, session)
      .input("ReceiptNo", sql.Int, receiptNo);

    const subResult = await subRequest.query(`
      SELECT * FROM SubLedgers
      WHERE CollegeName = @CollegeName
        AND LedgerName = @LedgerName
        AND Session = @Session
        AND ReceiptNo = @ReceiptNo
    `);

    for (const subRow of subResult.recordset) {
      const subInsert = transaction.request();
      subInsert
        .input("Session", sql.NVarChar, subRow.Session ?? null)
        .input("CollegeName", sql.NVarChar, subRow.CollegeName ?? null)
        .input("TransactionType", sql.NVarChar, subRow.TransactionType ?? null)
        .input("TransactionID", sql.Int, subRow.TransactionID ?? null)
        .input("LedgerName", sql.NVarChar, subRow.LedgerName ?? null)
        .input("ReceiptNo", sql.Int, subRow.ReceiptNo ?? null)
        .input("Subhead", sql.NVarChar, subRow.Subhead ?? null)
        .input("Debit", sql.Decimal(18, 2), subRow.Debit ?? null)
        .input("Credit", sql.Decimal(18, 2), subRow.Credit ?? null)
        .input("UserID", sql.NVarChar, userId || null);

      await subInsert.query(`
        INSERT INTO CancelledReceiptHeads
          (Session, CollegeName, TransactionType, TransactionID, LedgerName, ReceiptNo, Subhead, Debit, Credit, UserID)
        VALUES
          (@Session, @CollegeName, @TransactionType, @TransactionID, @LedgerName, @ReceiptNo, @Subhead, @Debit, @Credit, @UserID)
      `);
    }

    const deleteLedgerRequest = transaction.request();
    deleteLedgerRequest
      .input("CollegeName", sql.NVarChar, collegeName)
      .input("LedgerName", sql.NVarChar, ledgerName)
      .input("Session", sql.NVarChar, session)
      .input("ReceiptNo", sql.Int, receiptNo);
    await deleteLedgerRequest.query(`
      DELETE FROM Ledger
      WHERE CollegeName = @CollegeName
        AND LedgerName = @LedgerName
        AND Session = @Session
        AND ReceiptNo = @ReceiptNo
    `);

    const deleteSubRequest = transaction.request();
    deleteSubRequest
      .input("CollegeName", sql.NVarChar, collegeName)
      .input("LedgerName", sql.NVarChar, ledgerName)
      .input("Session", sql.NVarChar, session)
      .input("ReceiptNo", sql.Int, receiptNo);
    await deleteSubRequest.query(`
      DELETE FROM SubLedgers
      WHERE CollegeName = @CollegeName
        AND LedgerName = @LedgerName
        AND Session = @Session
        AND ReceiptNo = @ReceiptNo
    `);

    await transaction.commit();
    return { success: true, message: "Receipt has been cancelled successfully" };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

/**
 * Mirrors VB Display(): CancelledReceipt rows within a date range, ordered
 * by DateEntry descending. VB scopes this to the logged-in user's
 * privileged colleges (Module1.GetCollege()) rather than the search combo
 * — since that permission system isn't ported here, collegeName is an
 * OPTIONAL filter: pass it to scope to one college, omit it to see all.
 */
const getCancelledReceipts = async ({ collegeName, dateFrom, dateTo }) => {
  const pool = await getPool();
  const request = pool.request();

  let query = `
    SELECT *, CONVERT(varchar, DateEntry, 101) AS DateDisplay
    FROM CancelledReceipt
    WHERE DateEntry BETWEEN @DateFrom AND @DateTo
  `;
  request.input("DateFrom", sql.DateTime, dateFrom);
  request.input("DateTo", sql.DateTime, dateTo);

  if (collegeName) {
    query += ` AND CollegeName = @CollegeName`;
    request.input("CollegeName", sql.NVarChar, collegeName);
  }

  query += ` ORDER BY DateEntry DESC`;

  const result = await request.query(query);
  return result.recordset;
};

module.exports = {
  getColleges,
  getLedgerNames,
  searchReceipt,
  addCancelledReceipt,
  getCancelledReceipts,
};