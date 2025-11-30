const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");
router.get("/viewAll", eventController.ViewAllEvent);
router.get("/detail/:id", eventController.ViewDetailEvent);
router.get("/getArtists/:event_id", eventController.getArtistsInfor);
router.get("/search", eventController.search);
module.exports = router;
