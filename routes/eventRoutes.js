const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../config/multer");

router.post("/create-event", authMiddleware, upload.single('thumbnail') ,eventController.requestCreateEvent)
router.get("/:id/seats", eventController.getEventSeats)
router.get("/:id/tickets", eventController.getEventTickets);


module.exports = router
