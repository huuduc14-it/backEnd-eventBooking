const BookingModel = require("../models/bookingModel");

exports.bookTickets = async (req, res) => {
  try {
    const userId = req.user.id; // From Auth Middleware
    const { event_id, items } = req.body;

    // Expected JSON:
    // { "event_id": 1, "items": [ { "ticket_type_id": 5, "quantity": 2 } ] }

    if (!event_id || !items || items.length === 0) {
      return res.status(400).json({ message: "Invalid booking data" });
    }

    const result = await BookingModel.createBooking(userId, event_id, items);

    return res.status(201).json({
      success: true,
      message: "Booking Successful",
      bookingId: result.bookingId,
      totalAmount: result.totalAmount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyTicket = async (req, res) => {
  try {
    const { qr_code } = req.body;

    if (!qr_code) {
      return res
        .status(400)
        .json({ success: false, message: "QR Code is required" });
    }

    const result = await BookingModel.verifyTicket(qr_code);

    if (result.status === "INVALID") {
      return res.status(404).json({ success: false, message: result.message });
    } else if (result.status === "ALREADY_USED") {
      return res
        .status(409)
        .json({ success: false, message: result.message, ticket: result.data }); // 409 Conflict
    }

    return res.json({
      success: true,
      message: result.message,
      ticket: result.data,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyHistory = async (req, res) => {
  try {
    const userId = req.user.id; // From Auth Token
    const tickets = await BookingModel.getMyTickets(userId);

    return res.json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
