"use strict";
const express = require("express");
const { validObjectId, asyncHandler } = require("../lib/request");
const { getPhotoById } = require("../controllers/photoController");
const router = express.Router();

router.get("/:id", validObjectId, asyncHandler(getPhotoById));
module.exports = router;
