const { sql, getPool } = require("../config/db");

const getHostelNames = async () => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT DISTINCT HostelName FROM MasterHostelCharges
    WHERE HostelName IS NOT NULL
    ORDER BY HostelName
  `);
  return result.recordset.map((r) => r.HostelName);
};

const getHostelReport = async (collegeName, hostelName) => {
  const pool = await getPool();
  const request = pool.request();

  let query = `
    SELECT
      IDNo,
      RegistrationNo,
      UniRollNo,
      StudentName,
      Class,
      CollegeName,
      HostelName,
      RoomType,
      RoomNo
    FROM Admissions
    WHERE HostelName = @HostelName
  `;
  request.input("HostelName", sql.VarChar(200), hostelName);

  if (collegeName) {
    query += ` AND CollegeName = @CollegeName`;
    request.input("CollegeName", sql.VarChar(200), collegeName);
  }

  query += ` ORDER BY IDNo`;

  const result = await request.query(query);
  return result.recordset;
};

module.exports = {
  getHostelNames,
  getHostelReport,
};