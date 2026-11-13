"use strict";
// LOAD DATA: cảnh báo, script xóa toàn bộ dữ liệu trong 3 collections Lab 2!
const mongoose = require("mongoose");
require("dotenv").config();
const dbConnect = require("./dbConnect");
const models = require("../modelData/models");
const User = require("./userModel");
const Photo = require("./photoModel");
const SchemaInfo = require("./schemaInfo");

async function dbLoad() {
  await dbConnect(); // Stop BEFORE any deletion if Atlas is not configured.
  try {
    await Promise.all([User.deleteMany({}), Photo.deleteMany({}), SchemaInfo.deleteMany({})]);
    const mapFakeId2RealId = new Map();
    for (const user of models.userListModel()) {
      const created = await User.create({
        first_name: user.first_name, // Important: schema uses first_name, NOT first.
        last_name: user.last_name,
        location: user.location,
        description: user.description,
        occupation: user.occupation,
      });
      mapFakeId2RealId.set(user._id, created._id);
      console.log(`+ User: ${user.first_name} ${user.last_name} (${created._id})`);
    }
    const samplePhotos = models.userListModel().flatMap((user) => models.photoOfUserModel(user._id));
    for (const photo of samplePhotos) {
      const comments = (photo.comments || []).map((comment) => ({
        comment: comment.comment,
        date_time: comment.date_time,
        user_id: mapFakeId2RealId.get(comment.user._id),
      }));
      if (comments.some((comment) => !comment.user_id)) {
        throw new Error(`Bình luận thiếu tác giả hợp lệ trong ảnh ${photo.file_name}`);
      }
      await Photo.create({
        file_name: photo.file_name,
        date_time: photo.date_time,
        user_id: mapFakeId2RealId.get(photo.user_id),
        comments,
      });
      console.log(`+ Photo: ${photo.file_name} (${comments.length} comments)`);
    }
    await SchemaInfo.create({ version: "1.0" });
    console.log(`Nạp dữ liệu thành công: ${mapFakeId2RealId.size} người dùng, ${samplePhotos.length} ảnh, ${samplePhotos.reduce((sum, p) => sum + (p.comments || []).length, 0)} bình luận.`);
  } finally {
    await mongoose.disconnect();
  }
}

dbLoad().catch((error) => { console.error("Lỗi nạp dữ liệu:", error); process.exitCode = 1; });
