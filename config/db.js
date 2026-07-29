// const sql = require("mssql/msnodesqlv8");
// require("dotenv").config();

// // Active Connection Config using process.env
// const dbServer = process.env.DB_SERVER || "112.196.105.162";
// const dbDatabase = process.env.DB_DATABASE || "DBSmartCampusAsra";
// const dbUser = process.env.DB_USER || "sa";
// const dbPassword = process.env.DB_PASSWORD || "b2y3rt98159(*!%(";

// const config = {
//   // New Active Connection: Remote SQL Server 112.196.105.162
//   connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${dbServer};Database=${dbDatabase};Uid=${dbUser};Pwd=${dbPassword};`,
  
//   // Old Local DB Connections (Commented out):
//   // connectionString: "Driver={ODBC Driver 17 for SQL Server};Server=DESKTOP-Q884IGA;Database=DBSmartCampusAsra;Trusted_Connection=Yes;",
//   // connectionString: "Driver={ODBC Driver 17 for SQL Server};Server=DESKTOP-UCBVR7F;Database=DBSmartCampusAsra;Trusted_Connection=Yes;",
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

// module.exports = { sql, connectDB, getPool };




const sql = require("mssql"); // NOT mssql/msnodesqlv8
require("dotenv").config();
// Active Connection Config using process.env
const dbServer = process.env.DB_SERVER || "112.196.105.162";
const dbDatabase = process.env.DB_DATABASE || "DBSmartCampusAsra";
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