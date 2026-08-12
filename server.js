// const express = require("express");
// const cors = require("cors");
// require("dotenv").config();

// const { connectDB } = require("./config/db.js");
// const authRoutes = require("./routes/authRoutes");
// const menuRoutes = require("./routes/menuRoutes");

// const semesterRoutes = require("./routes/semesterRoutes");
// const schemeRoutes = require("./routes/schemeRoutes");
// const ledgerRoutes = require("./routes/ledgerRoutes");
// const studentActivityFundRoutes = require("./routes/studentActivityFundRoutes");

// const masterCourseRoutes = require("./routes/masterCourseRoutes");
// const masterAnnualFeeRoutes = require("./routes/masterAnnualFeeRoutes");
// const masterCategoryRoutes = require("./routes/masterCategoryRoutes");
// const masterHostelBusValidityRoutes = require("./routes/masterHostelBusValidityRoutes");
// const masterSchemeRoutes = require("./routes/masterSchemeRoutes");
// const studentBasicDetailsRoutes = require("./routes/studentBasicDetailsRoutes");
// const feeSingleHeadRoutes = require("./routes/feeSingleHeadRoutes");
// const admissionsRoutes = require("./routes/admissionsRoutes");
// const admissionFeeRoutes = require("./routes/admissionFeeRoutes");
// const dayBookRoutes = require("./routes/dayBookRoutes");
// const customSubLedgersRoutes = require("./routes/customSubLedgersRoutes");
// const cancelReceiptRoutes = require("./routes/cancelReceiptRoutes");
// const deadDebitsRouters = require("./routes/deadDebitsRoutes")
// const cancelRestoreRoutes = require("./routes/cancelRestoreRoutes");
// const receiptUpdateRoutes = require("./routes/receiptUpdateRoutes");
// const facilityRoutes = require("./routes/facilityRoutes");

// const app = express();

// connectDB();


// // CORS configuration
// app.use(cors({
//   origin: [
//     "https://account-frontend-one.vercel.app",
//     // "http://localhost:3000"
//   ],
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"]
// }));




// app.use(express.json());

// // Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/menu", menuRoutes);

// app.use("/api/semester", semesterRoutes);
// app.use("/api/scheme", schemeRoutes);
// app.use("/api/ledger", ledgerRoutes);
// app.use("/api/student-activity-fund", studentActivityFundRoutes);
// app.use("/api/student-basic-details", studentBasicDetailsRoutes);
// app.use("/api/fee-single-head", feeSingleHeadRoutes);
// app.use("/api/feeSingleHead", feeSingleHeadRoutes);

// app.use("/api/master-course", masterCourseRoutes);
// app.use("/api/master-annual-fee", masterAnnualFeeRoutes);
// app.use("/api/master-category", masterCategoryRoutes);
// app.use("/api/master-hostel-bus-validity", masterHostelBusValidityRoutes);
// app.use("/api/master-scheme", masterSchemeRoutes);
// app.use("/api/admissions", admissionsRoutes);
// app.use("/api/admission-fee", admissionFeeRoutes);
// app.use("/api/custom-sub-ledgers", customSubLedgersRoutes);
// app.use("/api/day-book", dayBookRoutes);
// app.use("/api/cancel-receipt", cancelReceiptRoutes);
// app.use("/api/dead-debits", deadDebitsRouters);
// app.use("/api/cancel-restore", cancelRestoreRoutes);
// app.use("/api/cancelRestore", cancelRestoreRoutes);
// app.use("/api/receipt-update", receiptUpdateRoutes);
// app.use("/api/facility", facilityRoutes);
// const PORT = process.env.PORT || 5000;

// if (process.env.NODE_ENV !== "production") {
//   app.listen(PORT, () => {
//     console.log(`Server running on ${PORT}`);
//   });
// }

// module.exports = app;


const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectDB } = require("./config/db");
const debitRoutes = require("./routes/debitRoutes");
const authRoutes = require("./routes/authRoutes");
const menuRoutes = require("./routes/menuRoutes");
const semesterRoutes = require("./routes/semesterRoutes");
const schemeRoutes = require("./routes/schemeRoutes");
const ledgerRoutes = require("./routes/ledgerRoutes");
const studentActivityFundRoutes = require("./routes/studentActivityFundRoutes");
const masterCourseRoutes = require("./routes/masterCourseRoutes");
const masterAnnualFeeRoutes = require("./routes/masterAnnualFeeRoutes");
const masterCategoryRoutes = require("./routes/masterCategoryRoutes");
const masterHostelBusValidityRoutes = require("./routes/masterHostelBusValidityRoutes");
const masterSchemeRoutes = require("./routes/masterSchemeRoutes");
const studentBasicDetailsRoutes = require("./routes/studentBasicDetailsRoutes");
const feeSingleHeadRoutes = require("./routes/feeSingleHeadRoutes");
const admissionsRoutes = require("./routes/admissionsRoutes");
const admissionFeeRoutes = require("./routes/admissionFeeRoutes");
const dayBookRoutes = require("./routes/dayBookRoutes");
const customSubLedgersRoutes = require("./routes/customSubLedgersRoutes");
const cancelReceiptRoutes = require("./routes/cancelReceiptRoutes");
const deadDebitsRoutes = require("./routes/deadDebitsRoutes");
const cancelRestoreRoutes = require("./routes/cancelRestoreRoutes");
const receiptUpdateRoutes = require("./routes/receiptUpdateRoutes");
const facilityRoutes = require("./routes/facilityRoutes");
const concessionRoutes = require("./routes/concessionRoutes");
const feeReportRoutes = require("./routes/feeReportRoutes");
const hostelReportRoutes = require("./routes/hostelReportRoutes");

const app = express();

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
// Fix: explicit allowlist, checked with a function instead of a plain array,
// so unexpected/preview origins get a clear log line instead of a silent
// browser-side CORS error that's hard to diagnose. Add every real frontend
// origin you use here (production alias + any preview URLs you test from).
const allowedOrigins = [
  "https://account-frontend-one.vercel.app",
  // "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // requests with no Origin header (curl, server-to-server, health checks)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn(`CORS blocked request from origin: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// ---------------------------------------------------------------------------
// Database connection
// ---------------------------------------------------------------------------
// Fix: previously gated behind `if (NODE_ENV !== "production")`, which meant
// this NEVER ran on Vercel (Vercel always sets NODE_ENV=production), so the
// pool was never created and every DB-backed route (like /api/auth/login)
// threw before Express could respond — which surfaces in the browser as a
// misleading CORS error instead of the real "DB not connected" error.
//
// Fix: also previously called as a bare `connectDB();` with no await and no
// error handling — an unhandled rejection on a bad cold start could crash
// the whole function invocation, again producing a headerless platform error
// that looks like CORS.
//
// This version: connect once, reuse the pool across warm invocations
// (dbReady caches the promise so concurrent cold-start requests await the
// same connection attempt instead of racing separate ones), and never let a
// DB failure bring down the whole process — only the requests that actually
// need the DB fail, with an actual Express JSON error response that DOES
// carry the CORS headers set above.
let dbReady = null;
function ensureDbConnected() {
  if (!dbReady) {
    dbReady = connectDB().catch((err) => {
      console.error("❌ Database connection failed:", err);
      dbReady = null; // allow a retry on the next request instead of caching the failure forever
      throw err;
    });
  }
  return dbReady;
}

app.use(async (req, res, next) => {
  try {
    await ensureDbConnected();
    next();
  } catch (err) {
    res.status(503).json({
      success: false,
      message: "Database unavailable, please try again shortly.",
    });
  }
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);

app.use("/api/semester", semesterRoutes);
app.use("/api/scheme", schemeRoutes);
app.use("/api/ledger", ledgerRoutes);
app.use("/api/student-activity-fund", studentActivityFundRoutes);
app.use("/api/student-basic-details", studentBasicDetailsRoutes);

app.use("/api/fee-single-head", feeSingleHeadRoutes);
app.use("/api/feeSingleHead", feeSingleHeadRoutes);

app.use("/api/master-course", masterCourseRoutes);
app.use("/api/master-annual-fee", masterAnnualFeeRoutes);
app.use("/api/master-category", masterCategoryRoutes);
app.use("/api/master-hostel-bus-validity", masterHostelBusValidityRoutes);
app.use("/api/master-scheme", masterSchemeRoutes);
app.use("/api/debit", debitRoutes);
app.use("/api/admissions", admissionsRoutes);
app.use("/api/admission-fee", admissionFeeRoutes);
app.use("/api/custom-sub-ledgers", customSubLedgersRoutes);
app.use("/api/day-book", dayBookRoutes);
app.use("/api/cancel-receipt", cancelReceiptRoutes);
app.use("/api/dead-debits", deadDebitsRoutes);

app.use("/api/cancel-restore", cancelRestoreRoutes);
app.use("/api/cancelRestore", cancelRestoreRoutes);

app.use("/api/receipt-update", receiptUpdateRoutes);
app.use("/api/facility", facilityRoutes);
app.use("/api/concession", concessionRoutes);
app.use("/api/fee-report", feeReportRoutes);
app.use("/api/hostel-report", hostelReportRoutes);

// Health Check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API Running Successfully",
  });
});

// ---------------------------------------------------------------------------
// CORS-aware error handler
// ---------------------------------------------------------------------------
// Fix: if the CORS origin callback above rejects a request, or any route
// throws, Express's default handler can respond before the cors middleware
// gets to add headers on certain error paths. This explicit handler makes
// sure every error response — including CORS rejections — is still valid
// JSON with a real status code, which is easier to diagnose from devtools
// than a bare CORS failure.
app.use((err, req, res, next) => {
  console.error(err);
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ success: false, message: "CORS: origin not allowed" });
  }
  return res.status(500).json({ success: false, message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;

// Local dev only — on Vercel the exported `app` is wrapped by their Node
// serverless adapter, which calls it as a request handler directly and
// never calls app.listen itself.
if (process.env.NODE_ENV !== "production") {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error("❌ Failed to connect database");
      console.error(err);
      process.exit(1);
    });
}

module.exports = app;