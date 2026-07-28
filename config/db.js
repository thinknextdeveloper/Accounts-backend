const sql = require("mssql/msnodesqlv8");

const config = {
  connectionString:
    "Driver={ODBC Driver 17 for SQL Server};Server=DESKTOP-Q884IGA;Database=DBSmartCampusAsra;Trusted_Connection=Yes;",
  //"Driver={ODBC Driver 17 for SQL Server};Server=DESKTOP-UCBVR7F;Database=DBSmartCampusAsra;Trusted_Connection=Yes;",
};

let pool;

async function connectDB() {
  try {
    pool = await sql.connect(config);
    console.log("✅ SQL Server Connected");
    return pool;
  } catch (err) {
    console.error("Database Error:", err);
    throw err;
  }
}

async function getPool() {
  if (!pool || !pool.connected) {
    if (pool) {
      try {
        await pool.close();
      } catch (e) { }
    }
    await connectDB();
  }
  return pool;
}

module.exports = { sql, connectDB, getPool };