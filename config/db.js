

// const sql = require("mssql"); 
// require("dotenv").config();
// // Active Connection Config using process.env
// const dbServer = "112.196.105.162";
// const dbDatabase =  "DBSmartCampusTest";
// const dbUser = "sa";
// const dbPassword ="b2y3rt98159(*!%(";

// const config = {
//   server: dbServer,
//   database: dbDatabase,
//   user: dbUser,
//   password: dbPassword,
//   port: 1433,
//   options: {
//     encrypt: false, // set true if your server requires TLS; try false first for a plain remote SQL Server
//     trustServerCertificate: true,
//   },
//   pool: {
//     max: 5,
//     min: 0,
//     idleTimeoutMillis: 15000, // close idle connections quickly - important for serverless
//   },
// };

// let pool;

// async function connectDB() {
//   try {
//     pool = await sql.connect(config);
//     console.log(`✅ SQL Server Connected (${dbServer} -> ${dbDatabase})`);
//     return pool;
//   } catch (err) {
//     console.error("Database Error:", err);
//     throw err;
//   }
// }

// async function getPool() {
//   if (!pool || !pool.connected) {
//     if (pool) {
//       try {
//         await pool.close();
//       } catch (e) {}
//     }
//     await connectDB();
//   }
//   return pool;
// }

// /**
//  * Runs a query function against the pool, and if it fails specifically
//  * because the pooled connection was silently closed (common in serverless,
//  * where the function is frozen between invocations), forces a fresh
//  * reconnect and retries once.
//  */
// async function withRetry(queryFn) {
//   let currentPool = await getPool();

//   try {
//     return await queryFn(currentPool);
//   } catch (err) {
//     const isConnectionClosed =
//       err?.message === "Connection is closed." ||
//       err?.code === "ECONNCLOSED" ||
//       err?.code === "ENOTOPEN";

//     if (!isConnectionClosed) {
//       throw err;
//     }

//     console.warn("Connection was closed - reconnecting and retrying once...");
//     pool = null;
//     currentPool = await getPool();
//     return await queryFn(currentPool);
//   }
// }

// module.exports = { sql, connectDB, getPool, withRetry };

const sql = require("mssql");
require("dotenv").config();

// Active Connection Config
const dbServer = "112.196.105.162";
const dbDatabase = "DBSmartCampusTest";
const dbUser = "sa";
const dbPassword = "b2y3rt98159(*!%(";

console.log("========== DATABASE CONFIG ==========");
console.log("Server   :", dbServer);
console.log("Database :", dbDatabase);
console.log("User     :", dbUser);
console.log("Port     :", 1433);
console.log("=====================================");

const config = {
  server: dbServer,
  database: dbDatabase,
  user: dbUser,
  password: dbPassword,
  port: 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  pool: {
    max: 5,
    min: 0,
    idleTimeoutMillis: 15000,
  },
};

let pool;

async function connectDB() {
  try {
    console.log("Connecting to SQL Server...");
    console.log(config);

    pool = await sql.connect(config);

    console.log(`✅ SQL Server Connected (${dbServer} -> ${dbDatabase})`);

    // Verify the actual database after connecting
    const result = await pool.request().query(`
      SELECT
        DB_NAME() AS CurrentDatabase,
        @@SERVERNAME AS ServerName
    `);

    console.log("Connected Database:", result.recordset[0]);

    return pool;
  } catch (err) {
    console.error("❌ Database Error:", err);
    throw err;
  }
}

async function getPool() {
  if (!pool || !pool.connected) {
    console.log("Pool not connected. Creating new connection...");
    if (pool) {
      try {
        await pool.close();
      } catch (e) {}
    }
    await connectDB();
  }
  return pool;
}

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