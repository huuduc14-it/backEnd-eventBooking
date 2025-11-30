const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const eventController = require("../controllers/eventController");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/viewAll", eventController.ViewAllEvent);
router.get("/detail", eventController.ViewDetailEvent);
module.exports = router;
