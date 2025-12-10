const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../config/multer");
/////////////////
router.post(
  "/create-event",
  authMiddleware,
  eventController.requestCreateEvent
);
router.get("/:id/seats", eventController.getEventSeats);
router.get("/:id/tickets", eventController.getEventTickets);
/////////////
router.get("/viewAll", eventController.ViewAllEvent);
router.get("/detail/:id", eventController.ViewDetailEvent);
router.get("/getArtists/:event_id", eventController.getArtistsInfor);
router.get("/search", eventController.search);
module.exports = router;
