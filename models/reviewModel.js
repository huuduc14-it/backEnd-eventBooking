const db = require("../config/db");

module.exports = {
  // Tạo review
  createReview: async (user_id, event_id, rating, comment) => {
    const sql = `
      INSERT INTO reviews (user_id, event_id, rating, comment)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await db.execute(sql, [
      user_id,
      event_id,
      rating,
      comment,
    ]);
    return result; // result.insertId có thể dùng để trả về review_id
  },

  // Lấy danh sách review theo event
  getReviewsByEvent: async (event_id) => {
    const sql = `
      SELECT r.review_id, r.rating, r.comment, r.created_at,
             u.full_name, u.avatar_url
      FROM reviews r
      JOIN users u ON r.user_id = u.user_id
      WHERE r.event_id = ?
      ORDER BY r.created_at DESC
    `;
    const [rows] = await db.execute(sql, [event_id]);
    return rows; // trả về danh sách review
  },
};
