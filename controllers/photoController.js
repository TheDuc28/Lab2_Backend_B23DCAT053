"use strict";
const User = require("../db/userModel");
const Photo = require("../db/photoModel");
const { userListModel, photoModel } = require("../lib/apiModels");
const { invalidUser } = require("../lib/request");

async function enrichPhotos(photos) {
  const authorIds = new Set();
  photos.forEach((photo) => (photo.comments || []).forEach((comment) => {
    if (comment.user_id) authorIds.add(String(comment.user_id));
  }));
  const authors = await User.find(
    { _id: { $in: [...authorIds] } }, "_id first_name last_name"
  ).lean();
  const authorsById = new Map(authors.map((user) => [String(user._id), userListModel(user)]));
  return photos.map((photo) => photoModel(photo, authorsById));
}

async function getPhotosOfUser(req, response) {
  const user = await User.findById(req.params.id, "_id").lean();
  if (!user) return invalidUser(response);
  const photos = await Photo.find({ user_id: user._id },
    "_id user_id comments file_name date_time").sort({ date_time: -1 }).lean();
  return response.json(await enrichPhotos(photos));
}

// Extra credit: show one photo with all its comments when a thumbnail is clicked.
async function getPhotoById(req, response) {
  const photo = await Photo.findById(req.params.id,
    "_id user_id comments file_name date_time").lean();
  if (!photo) return response.status(404).json({ error: "Không tìm thấy ảnh." });
  const [result] = await enrichPhotos([photo]);
  return response.json(result);
}

module.exports = { getPhotosOfUser, getPhotoById };
