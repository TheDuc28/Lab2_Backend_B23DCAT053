"use strict";
const express = require("express");
const path = require("path");
const cors = require("cors");
const UserRouter = require("./routes/UserRouter");
const PhotoRouter = require("./routes/PhotoRouter");
const { validObjectId, asyncHandler } = require("./lib/request");
const { getPhotosOfUser } = require("./controllers/photoController");
const { getCommentsOfUser } = require("./controllers/userController");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/images", express.static(path.join(__dirname, "images")));

app.get("/", (_req, res) => res.json({
  message: "Lab 2 Photo Sharing API",
  student: "Nguyễn Thế Đức", student_id: "B23DCAT053",
  endpoints: ["/user/list", "/user/:id", "/photosOfUser/:id", "/user/stats", "/commentsOfUser/:id", "/photo/:id"],
}));
app.use("/user", UserRouter);
app.get("/photosOfUser/:id", validObjectId, asyncHandler(getPhotosOfUser));
app.get("/commentsOfUser/:id", validObjectId, asyncHandler(getCommentsOfUser));
app.use("/photo", PhotoRouter);
app.use((_req, res) => res.status(404).json({ error: "Đường dẫn API không tồn tại." }));
app.use((err, _req, res, _next) => {
  console.error("API error:", err);
  res.status(500).json({ error: "Lỗi máy chủ khi truy cập MongoDB." });
});
module.exports = app;
