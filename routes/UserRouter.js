"use strict";
const express = require("express");
const { validObjectId, asyncHandler } = require("../lib/request");
const {
  getUserList, getUserById, getUserStats, getCommentsOfUser,
} = require("../controllers/userController");
const router = express.Router();

router.get("/list", asyncHandler(getUserList));
router.get("/stats", asyncHandler(getUserStats)); // Extra credit
router.get("/:id/comments", validObjectId, asyncHandler(getCommentsOfUser));
router.get("/:id", validObjectId, asyncHandler(getUserById));

module.exports = router;
