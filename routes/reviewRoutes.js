const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const verifyToken = require("../middlewares/authMiddleware");

router.post("/create", verifyToken, reviewController.createReview);
router.get("/event/:event_id", reviewController.getReviewsByEvent);

module.exports = router;
