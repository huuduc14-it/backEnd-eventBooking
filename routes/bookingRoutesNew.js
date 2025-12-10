const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingControllerNew");
const authMiddleware = require("../middlewares/authMiddleware");
const organizerMiddleware = require("../middlewares/organizerMiddleware");

// Public routes (có thể xem không cần đăng nhập)
router.get("/events/:event_id/ticket-types", bookingController.getTicketTypes);

// Protected routes (cần đăng nhập)
router.use(authMiddleware);

// User booking routes
router.post("/bookings", bookingController.createBooking);
router.get("/bookings", bookingController.getMyBookings);
router.get("/bookings/:booking_id", bookingController.getBookingDetail);
router.post("/bookings/confirm-payment", bookingController.confirmPayment);
router.delete("/bookings/:booking_id", bookingController.cancelBooking);

// Check-in routes (có thể dùng cho staff)
router.post("/tickets/check-in", bookingController.checkInTicket);

// Organizer routes
router.put(
  "/ticket-types/update-quantity",
  authMiddleware,
  organizerMiddleware,
  bookingController.updateTicketQuantity
);

module.exports = router;
