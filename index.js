"use strict";
require("dotenv").config();
const app = require("./app");
const dbConnect = require("./db/dbConnect");

const PORT = Number(process.env.PORT || 8081);
(async () => {
  try {
    await dbConnect();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Lab 2 API đã chạy tại http://localhost:${PORT}`);
      console.log(`Danh sách người dùng: http://localhost:${PORT}/user/list`);
    });
  } catch (error) {
    console.error("Không thể khởi động backend vì MongoDB chưa kết nối:", error.message);
    process.exitCode = 1;
  }
})();
