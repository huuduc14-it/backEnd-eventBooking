// controllers/ticketController.js
const db = require("../config/db"); // db.js
const Ticket = require("../models/ticketModel"); // model nếu có thể tách

module.exports = {
  // Lấy danh sách vé của user theo token
  getTicketsByUser: async (req, res) => {
    try {
      const userId = req.user.user_id; // Lấy từ middleware auth

      if (!userId) {
        return res
          .status(400)
          .json({ success: false, message: "User ID missing" });
      }

      // Query vé theo user
      const [tickets] = await db.execute(
        `
        SELECT
            t.ticket_id,
            t.qr_code,
            t.is_used,
            e.event_id,
            e.title AS event_title,
            e.start_time,
            e.thumbnail_url,
            tt.name AS ticket_type_name,
            bi.price,
            b.created_at AS purchase_date
        FROM tickets t
        JOIN booking_items bi   ON t.booking_item = bi.item_id
        JOIN bookings b         ON bi.booking_id = b.booking_id
        JOIN ticket_types tt    ON bi.ticket_type_id = tt.ticket_type_id
        JOIN events e           ON b.event_id = e.event_id
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC
        `,
        [userId]
      );

      return res.json({
        success: true,
        tickets,
      });
    } catch (err) {
      console.error("TICKET ERROR:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  },
};
