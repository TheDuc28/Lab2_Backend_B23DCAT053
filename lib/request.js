"use strict";
const mongoose = require("mongoose");

function validObjectId(request, response, next) {
  if (!mongoose.Types.ObjectId.isValid(request.params.id)) {
    response.status(400).json({ error: "ID không hợp lệ. Cần một MongoDB ObjectId gồm 24 ký tự hex." });
    return;
  }
  next();
}

function asyncHandler(fn) {
  return (request, response, next) => Promise.resolve(fn(request, response, next)).catch(next);
}

function invalidUser(response) {
  return response.status(400).json({ error: "Không tìm thấy người dùng với ID được cung cấp." });
}

module.exports = { validObjectId, asyncHandler, invalidUser };
