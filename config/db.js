const mysql = require("mysql2");

// Tạo pool để dễ quản lý connection, hỗ trợ promise
const db = mysql
  .createPool({
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "bookTicket",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })
  .promise();
module.exports = db;
