"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const models = require("../modelData/models");
const {
  userListModel, userDetailModel, photoModel, statsModels, commentModels,
} = require("../lib/apiModels");

const users = models.userListModel();
const photos = users.flatMap((user) => models.photoOfUserModel(user._id));
const byId = new Map(users.map((user) => [user._id, userListModel(user)]));

test("original Lab 2 data set: 6 users / 12 photos / 13 comments", () => {
  assert.equal(users.length, 6);
  assert.equal(photos.length, 12);
  assert.equal(photos.reduce((sum, photo) => sum + (photo.comments || []).length, 0), 13);
});

test("/user/list contains strictly _id, first_name, last_name", () => {
  const response = userListModel({ ...users[0], password: "secret" });
  assert.deepEqual(Object.keys(response), ["_id", "first_name", "last_name"]);
  assert.equal(response.first_name, "Ian");
  assert.ok(!("password" in response));
});

test("/user/:id returns precisely six required profile fields", () => {
  const response = userDetailModel({ ...users[0], password: "secret" });
  assert.deepEqual(Object.keys(response), ["_id", "first_name", "last_name", "location", "description", "occupation"]);
  assert.equal(response.occupation, "Mathematician");
  assert.ok(!("password" in response));
});

test("/photosOfUser/:id includes linked user objects with three fields only", () => {
  const original = photos.find((photo) => (photo.comments || []).length);
  const dbShape = { ...original, comments: original.comments.map((c) => ({ ...c, user_id: c.user._id })) };
  const response = photoModel(dbShape, byId);
  assert.deepEqual(Object.keys(response), ["_id", "user_id", "file_name", "date_time", "comments"]);
  const comment = response.comments[0];
  assert.deepEqual(Object.keys(comment), ["_id", "comment", "date_time", "user"]);
  assert.deepEqual(Object.keys(comment.user), ["_id", "first_name", "last_name"]);
  assert.equal(comment.user._id, original.comments[0].user._id);
});

test("all 12 sample photos can serialize correctly", () => {
  const response = photos.map((photo) => photoModel({
    ...photo, comments: (photo.comments || []).map((c) => ({ ...c, user_id: c.user._id })),
  }, byId));
  assert.equal(response.length, 12);
  assert.equal(response.reduce((sum, photo) => sum + photo.comments.length, 0), 13);
  for (const photo of response) {
    assert.ok(photo.file_name.endsWith(".jpg"));
    for (const comment of photo.comments) assert.ok(comment.user?.first_name);
  }
});

test("extra-credit count bubbles add to 12 photos and 13 comments", () => {
  // Sample data stores 'user' objects; MongoDB stores user_id ObjectIds.
  const converted = photos.map((p) => ({
    ...p, comments: (p.comments || []).map((c) => ({ ...c, user_id: c.user._id })),
  }));
  const response = statsModels(users, converted);
  assert.equal(response.length, 6);
  assert.equal(response.reduce((sum, u) => sum + u.photo_count, 0), 12);
  assert.equal(response.reduce((sum, u) => sum + u.comment_count, 0), 13);
  assert.equal(response.find((u) => u.user_id === users[0]._id).photo_count, 2);
});

test("extra-credit commentsByUser links every comment to a photo", () => {
  const converted = photos.map((p) => ({
    ...p, comments: (p.comments || []).map((c) => ({ ...c, user_id: c.user._id })),
  }));
  const all = users.flatMap((user) => commentModels(converted, user._id));
  assert.equal(all.length, 13);
  assert.ok(all.every((comment) => comment.photo.file_name && comment.photo._id));
  assert.ok(all.every((comment) => typeof comment.comment === "string"));
});

test("comment with missing author returns null, not hidden fields", () => {
  const response = photoModel({ _id: "photo", user_id: "user", file_name: "x.jpg", date_time: "now",
    comments: [{ _id: "c", comment: "hello", date_time: "now", user_id: "absent" }],
  }, new Map());
  assert.equal(response.comments[0].user, null);
});
