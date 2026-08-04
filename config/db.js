

const sql = require("mssql"); 
require("dotenv").config();
// Active Connection Config using process.env
const dbServer = process.env.DB_SERVER || "112.196.105.162";
const dbDatabase =  "DBSmartCampusTest";
const dbUser = process.env.DB_USER || "sa";
const dbPassword = process.env.DB_PASSWORD || "b2y3rt98159(*!%(";

const config = {
  server: dbServer,
  database: dbDatabase,
  user: dbUser,
  password: dbPassword,
  port: 1433,
  options: {
    encrypt: false, // set true if your server requires TLS; try false first for a plain remote SQL Server
    trustServerCertificate: true,
  },
  pool: {
    max: 5,
    min: 0,
    idleTimeoutMillis: 15000, // close idle connections quickly - important for serverless
  },
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

/**
 * Runs a query function against the pool, and if it fails specifically
 * because the pooled connection was silently closed (common in serverless,
 * where the function is frozen between invocations), forces a fresh
 * reconnect and retries once.
 */
async function withRetry(queryFn) {
  let currentPool = await getPool();

  try {
    return await queryFn(currentPool);
  } catch (err) {
    const isConnectionClosed =
      err?.message === "Connection is closed." ||
      err?.code === "ECONNCLOSED" ||
      err?.code === "ENOTOPEN";

    if (!isConnectionClosed) {
      throw err;
    }

    console.warn("Connection was closed - reconnecting and retrying once...");
    pool = null;
    currentPool = await getPool();
    return await queryFn(currentPool);
  }
}

module.exports = { sql, connectDB, getPool, withRetry };