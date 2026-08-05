const sql = require("mssql/msnodesqlv8");
require("dotenv").config();

// Active Connection Config using process.env
const dbServer = process.env.DB_SERVER ;
const dbDatabase = process.env.DB_DATABASE;
const dbUser = process.env.DB_USER ;
const dbPassword = process.env.DB_PASSWORD;

const config = {
  connectionString:
    "Driver={ODBC Driver 17 for SQL Server};Server=DESKTOP-UCBVR7F;Database=DBSmartCampusAsra;Trusted_Connection=Yes;",
  requestTimeout: 300000,
  connectionTimeout: 30000,
};
let pool;

async function connectDB() {
  try {
    pool = await sql.connect(config);
    console.log(`✅ SQL Server Connected (${dbServer} -> ${dbDatabase})`);
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
      } catch (e) {}
    }
    await connectDB();
  }
  return pool;
}

module.exports = { sql, connectDB, getPool };
