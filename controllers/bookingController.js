const BookingModel = require('../models/bookingModel');

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
            totalAmount: result.totalAmount
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};