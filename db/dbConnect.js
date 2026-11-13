"use strict";
const mongoose = require("mongoose");

async function dbConnect() {
  if (!process.env.DB_URL) {
    throw new Error("Thiếu DB_URL. Hãy tạo backend/.env từ .env.example và điền MongoDB Atlas URI.");
  }
  await mongoose.connect(process.env.DB_URL, { serverSelectionTimeoutMS: 10000 });
  console.log("Đã kết nối MongoDB Atlas thành công.");
  return mongoose.connection;
}

module.exports = dbConnect;
