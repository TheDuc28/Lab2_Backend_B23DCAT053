"use strict";
// Requires the backend and MongoDB Atlas to be running with seeded data.
const assert = require("node:assert/strict");
const base = process.env.API_BASE_URL || "http://localhost:8081";

async function request(path, expectedStatus = 200) {
  const response = await fetch(`${base}${path}`);
  const data = await response.json();
  assert.equal(response.status, expectedStatus, `${path}: ${JSON.stringify(data)}`);
  return data;
}

async function main() {
  const users = await request("/user/list");
  assert.ok(Array.isArray(users) && users.length > 0, "User list must be seeded");
  assert.deepEqual(Object.keys(users[0]).sort(), ["_id", "first_name", "last_name"].sort());
  const user = await request(`/user/${users[0]._id}`);
  assert.equal(user._id, users[0]._id);
  const photos = await request(`/photosOfUser/${users[0]._id}`);
  assert.ok(Array.isArray(photos));
  const stats = await request("/user/stats");
  assert.equal(stats.length, users.length);
  const comments = await request(`/commentsOfUser/${users[0]._id}`);
  assert.ok(Array.isArray(comments));
  await request("/user/not-valid", 400);
  await request("/photosOfUser/not-valid", 400);
  if (photos.length) {
    const photo = await request(`/photo/${photos[0]._id}`);
    assert.equal(photo._id, photos[0]._id);
  }
  console.log("SUCCESS: APIs GET /user/list, /user/:id, /photosOfUser/:id, /user/stats, /commentsOfUser/:id, /photo/:id and invalid ID validation.");
}

main().catch((error) => { console.error("API SMOKE TEST FAILED:", error.message); process.exitCode = 1; });
