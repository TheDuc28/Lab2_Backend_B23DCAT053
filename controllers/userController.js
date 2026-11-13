"use strict";
const User = require("../db/userModel");
const Photo = require("../db/photoModel");
const { userListModel, userDetailModel, statsModels, commentModels } = require("../lib/apiModels");
const { invalidUser } = require("../lib/request");

async function getUserList(_req, response) {
  const users = await User.find({}, "_id first_name last_name").sort({ first_name: 1 }).lean();
  response.json(users.map(userListModel));
}

async function getUserById(req, response) {
  const user = await User.findById(req.params.id, "_id first_name last_name location description occupation").lean();
  if (!user) return invalidUser(response);
  return response.json(userDetailModel(user));
}

// Extra credit: separate endpoint so /user/list keeps ONLY its three mandatory fields.
async function getUserStats(_req, response) {
  const [users, photos] = await Promise.all([
    User.find({}, "_id").lean(),
    Photo.find({}, "_id user_id comments.user_id").lean(),
  ]);
  response.json(statsModels(users, photos));
}

async function getCommentsOfUser(req, response) {
  const user = await User.findById(req.params.id, "_id").lean();
  if (!user) return invalidUser(response);
  const photos = await Photo.find({ "comments.user_id": user._id },
    "_id user_id file_name date_time comments").lean();
  return response.json(commentModels(photos, user._id));
}

module.exports = { getUserList, getUserById, getUserStats, getCommentsOfUser };
