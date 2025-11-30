const db = require("../config/db"); // connection MySQL

module.exports = {
  getUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.query(
        `SELECT user_id AS id, full_name, email, avatar_url 
         FROM users WHERE user_id = ?`,
        [userId],
        (err, results) => {
          if (err) return reject(err);
          resolve(results[0] || null);
        }
      );
    });
  },

  getTicketsByUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.query(
        `
        SELECT
            t.ticket_id,
            t.qr_code,
            t.is_used,
            e.event_id,
            e.title AS event_title,
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
        [userId],
        (err, results) => {
          if (err) return reject(err);
          resolve(results);
        }
      );
    });
  },
};
