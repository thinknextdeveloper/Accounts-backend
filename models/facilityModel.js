const { sql, getPool } = require("../config/db");

const getStudentByIdOrReg = async ({ idNo, registrationNo }) => {
  const pool = await getPool();
  const request = pool.request();

  let where = "";
  if (idNo) {
    request.input("IDNo", sql.BigInt, idNo);
    where = "WHERE IDNo = @IDNo";
  } else if (registrationNo) {
    request.input("RegistrationNo", sql.VarChar, registrationNo);
    where = "WHERE RegistrationNo = @RegistrationNo";
  } else {
    throw new Error("idNo or registrationNo is required.");
  }

  const result = await request.query(`
    SELECT
      IDNo, StudentType, CollegeName, StudentName, FatherName,
      Course, Batch, Class, Session, Sex, LateralEntry,
      Scheme, Category, Quota,
      Facility, HostelName, RoomType, RoomNo, BusRoute, Stopage,
      PermanentAddress, RegistrationNo
    FROM Admissions
    ${where}
  `);

  return result.recordset[0];
};

const getHostelNames = async () => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT DISTINCT HostelName FROM MasterHostel ORDER BY HostelName
  `);
  return result.recordset.map((r) => r.HostelName);
};

const getRoomTypesForHostel = async (hostelName) => {
  const pool = await getPool();
  const request = pool.request();
  request.input("HostelName", sql.VarChar, hostelName);
  const result = await request.query(`
    SELECT DISTINCT RoomType FROM MasterHostel WHERE HostelName = @HostelName ORDER BY RoomType
  `);
  return result.recordset.map((r) => r.RoomType);
};

const getRoomNumbers = async (hostelName, roomType) => {
  const pool = await getPool();
  const request = pool.request();
  request.input("HostelName", sql.VarChar, hostelName);
  request.input("RoomType", sql.VarChar, roomType);
  const result = await request.query(`
    SELECT DISTINCT RoomNo FROM MasterHostel
    WHERE HostelName = @HostelName AND RoomType = @RoomType
    ORDER BY RoomNo
  `);
  return result.recordset.map((r) => r.RoomNo);
};

const getBusRoutes = async () => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT DISTINCT Route FROM MasterBusRoute ORDER BY Route
  `);
  return result.recordset.map((r) => r.Route);
};

const getStopagesForRoute = async (route) => {
  const pool = await getPool();
  const request = pool.request();
  request.input("Route", sql.VarChar, route);
  const result = await request.query(`
    SELECT DISTINCT Stopage FROM MasterBusRoute WHERE Route = @Route ORDER BY Stopage
  `);
  return result.recordset.map((r) => r.Stopage);
};

const updateFacility = async (idNo, facility) => {
  const pool = await getPool();
  const request = pool.request();
  request.input("IDNo", sql.BigInt, idNo);
  request.input("Facility", sql.VarChar, facility.type); // "Hostel" | "Bus" | "None"
  request.input("HostelName", sql.VarChar, facility.hostelName || null);
  request.input("RoomType", sql.VarChar, facility.roomType || null);
  request.input("RoomNo", sql.VarChar, facility.roomNo || null);
  request.input("BusRoute", sql.VarChar, facility.route || null);
  request.input("Stopage", sql.VarChar, facility.stopage || null);

  await request.query(`
    UPDATE Admissions
    SET Facility = @Facility,
        HostelName = @HostelName,
        RoomType = @RoomType,
        RoomNo = @RoomNo,
        BusRoute = @BusRoute,
        Stopage = @Stopage
    WHERE IDNo = @IDNo
  `);

  return facility;
};

module.exports = {
  getStudentByIdOrReg,
  getHostelNames,
  getRoomTypesForHostel,
  getRoomNumbers,
  getBusRoutes,
  getStopagesForRoute,
  updateFacility,
};