"use strict";
// Controller-level tests with an in-memory Mongoose-query substitute.
// They verify actual Express handler output, not a MongoDB network connection.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const models = require("../modelData/models");
const apiModels = require("../lib/apiModels");

const users = models.userListModel();
const photos = users.flatMap((user) => models.photoOfUserModel(user._id)).map((photo) => ({
  ...photo, comments: (photo.comments || []).map((comment) => ({
    _id: comment._id, comment: comment.comment, date_time: comment.date_time, user_id: comment.user._id,
  })),
}));

function query(data) {
  return {
    sort() { return this; },
    async lean() { return data; },
  };
}

const fakeUser = {
  find(criteria = {}) {
    if (criteria._id?.$in) {
      return query(users.filter((user) => criteria._id.$in.includes(user._id)));
    }
    return query(users);
  },
  findById(id) { return query(users.find((user) => user._id === String(id)) || null); },
};

const fakePhoto = {
  find(criteria = {}) {
    if (criteria.user_id !== undefined) {
      return query(photos.filter((photo) => photo.user_id === String(criteria.user_id)));
    }
    if (criteria["comments.user_id"] !== undefined) {
      return query(photos.filter((photo) => photo.comments.some((comment) => comment.user_id === String(criteria["comments.user_id"]))));
    }
    return query(photos);
  },
  findById(id) { return query(photos.find((photo) => photo._id === String(id)) || null); },
};

function loadController(filename) {
  const filepath = path.resolve(__dirname, `../controllers/${filename}`);
  const code = fs.readFileSync(filepath, "utf8");
  const module = { exports: {} };
  const fakeRequire = (specifier) => {
    if (specifier === "../db/userModel") return fakeUser;
    if (specifier === "../db/photoModel") return fakePhoto;
    if (specifier === "../lib/apiModels") return apiModels;
    if (specifier === "../lib/request") return {
      invalidUser(response) { return response.status(400).json({ error: "Không tìm thấy người dùng." }); },
    };
    throw new Error(`Unexpected require ${specifier}`);
  };
  const wrapper = vm.runInThisContext(`(function(require, module, exports) { ${code}\n})`, { filename: filepath });
  wrapper(fakeRequire, module, module.exports);
  return module.exports;
}

const userController = loadController("userController.js");
const photoController = loadController("photoController.js");

function response() {
  const result = { statusCode: 200, data: undefined };
  return { result,
    status(status) { result.statusCode = status; return this; },
    json(data) { result.data = data; return this; },
  };
}

test("getUserList only returns three fields for all 6 users", async () => {
  const res = response();
  await userController.getUserList({}, res);
  assert.equal(res.result.statusCode, 200);
  assert.equal(res.result.data.length, 6);
  assert.deepEqual(Object.keys(res.result.data[0]), ["_id", "first_name", "last_name"]);
});

test("getUserById returns profile; missing ID sends 400", async () => {
  const res = response();
  await userController.getUserById({ params: { id: users[0]._id } }, res);
  assert.equal(res.result.data.first_name, users[0].first_name);
  const bad = response();
  await userController.getUserById({ params: { id: "000000000000000000000000" } }, bad);
  assert.equal(bad.result.statusCode, 400);
});

test("getPhotosOfUser assembles embedded comments with linked commenter names", async () => {
  const res = response();
  await photoController.getPhotosOfUser({ params: { id: users[0]._id } }, res);
  assert.equal(res.result.data.length, 2);
  const comments = res.result.data.flatMap((p) => p.comments);
  assert.ok(comments.length > 0);
  assert.ok(comments.every((comment) => comment.user?.first_name));
  assert.ok(comments.every((comment) => !Object.hasOwn(comment, "user_id")));
});

test("getPhotosOfUser invalid user ID sends 400", async () => {
  const res = response();
  await photoController.getPhotosOfUser({ params: { id: "000000000000000000000000" } }, res);
  assert.equal(res.result.statusCode, 400);
});

test("getUserStats totals are consistent with source data", async () => {
  const res = response();
  await userController.getUserStats({}, res);
  assert.equal(res.result.data.reduce((n, u) => n + u.photo_count, 0), 12);
  assert.equal(res.result.data.reduce((n, u) => n + u.comment_count, 0), 13);
});

test("getCommentsOfUser returns comment text and linked photo thumbnail metadata", async () => {
  const res = response();
  await userController.getCommentsOfUser({ params: { id: users[0]._id } }, res);
  assert.ok(res.result.data.length >= 1);
  assert.ok(res.result.data[0].photo.file_name.endsWith(".jpg"));
});

test("getPhotoById returns a photo; unknown photo sends 404", async () => {
  const res = response();
  await photoController.getPhotoById({ params: { id: photos[0]._id } }, res);
  assert.equal(res.result.data._id, photos[0]._id);
  const bad = response();
  await photoController.getPhotoById({ params: { id: "000000000000000000000000" } }, bad);
  assert.equal(bad.result.statusCode, 404);
});
