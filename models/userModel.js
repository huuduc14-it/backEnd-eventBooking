const db = require("../config/db");

module.exports = {
  // Tạo user
  createUser: async (email, hashedPassword, name) => {
    const sql = `
      INSERT INTO users (full_name, email, password_hash)
      VALUES (?, ?, ?)
    `;
    const params = [name, email, hashedPassword]; // đúng thứ tự cột
    await db.execute(sql, params);
    return { message: "User created successfully" };
  },

  // Tìm user theo email
  findByEmail: async (email) => {
    const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    return rows[0]; // trả về 1 user
  },

  // Lấy tất cả sự kiện
  getAllEvent: async () => {
    const [rows] = await db.execute(
      "SELECT * FROM events ORDER BY created_at DESC"
    );
    return rows;
  },

  // Lấy chi tiết sự kiện theo ID
  getEventById: async (event_id) => {
    const [rows] = await db.execute("SELECT * FROM events WHERE event_id = ?", [
      event_id,
    ]);
    return rows[0];
  },

  // Lấy danh sách nghệ sĩ của 1 sự kiện
  getArtists: async (event_id) => {
    const sql = `
      SELECT a.artist_id, a.name, a.bio, a.image_url
      FROM event_artists ea
      INNER JOIN artists a ON ea.artist_id = a.artist_id
      WHERE ea.event_id = ?
    `;
    const [rows] = await db.execute(sql, [event_id]);
    return rows;
  },

  // Tìm kiếm sự kiện theo keyword, date, categoryId
  searchEvent: async (keyword, date, categoryId) => {
    let sql = `
      SELECT DISTINCT 
        e.event_id, e.title, e.category_id, e.start_time, e.location_name, e.thumbnail_url
      FROM events e
      LEFT JOIN event_artists ea ON e.event_id = ea.event_id
      LEFT JOIN artists a ON ea.artist_id = a.artist_id
      WHERE 1 = 1
    `;

    const params = [];

    // Lọc theo keyword
    if (keyword) {
      sql += ` AND (
        e.title COLLATE utf8mb4_unicode_ci LIKE ? OR
        e.description COLLATE utf8mb4_unicode_ci LIKE ? OR
        a.name COLLATE utf8mb4_unicode_ci LIKE ?
      )`;
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    // Lọc theo ngày
    if (date) {
      sql += ` AND DATE(e.start_time) = ?`;
      params.push(date);
    }

    // Lọc theo category
    if (categoryId) {
      sql += ` AND e.category_id = ?`;
      params.push(categoryId);
    }

    sql += ` ORDER BY e.start_time ASC`;

    const [rows] = await db.execute(sql, params);
    return rows;
  },
};
