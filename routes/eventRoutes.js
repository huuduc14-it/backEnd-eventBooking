const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const eventController = require("../controllers/eventController")

router.post("/create-event", eventController.requestCreateEvent)

module.exports = router