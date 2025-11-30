// models/organizerModel.js
const db = require("../config/db");

module.exports = {
  // 1.1 Đăng ký làm Organizer
  registerOrganizer: async (userId, orgName) => {
    const sql = `UPDATE users SET role = 'organizer', organization_name = ?, is_verified = 0 WHERE user_id = ?`;
    const [result] = await db.execute(sql, [orgName, userId]);
    return result;
  },

  // 1.2 & 1.3 Tạo sự kiện & Vé
  createEvent: async (organizerId, eventData, ticketTypes) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Insert Event
      const eventSql = `
        INSERT INTO events (title, description, start_time, location_name, thumbnail_url, category_id, organizer_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      const [eventResult] = await connection.execute(eventSql, [
        eventData.title,
        eventData.description,
        eventData.start_time,
        eventData.location_name,
        eventData.thumbnail_url,
        eventData.category_id,
        organizerId
      ]);
      const newEventId = eventResult.insertId;

      // Insert Ticket Types (Tính năng 1.3: Quản lý vé)
      if (ticketTypes && ticketTypes.length > 0) {
        const ticketSql = `INSERT INTO ticket_types (event_id, name, price, quantity) VALUES ?`;
        const ticketValues = ticketTypes.map(t => [newEventId, t.name, t.price, t.quantity]);
        await connection.query(ticketSql, [ticketValues]);
      }

      await connection.commit();
      return newEventId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // 1.4 Xem danh sách vé đã bán & Thống kê
  getEventStats: async (organizerId) => {
    // Lấy danh sách sự kiện của organizer kèm tổng vé đã bán và doanh thu
    const sql = `
        SELECT 
            e.event_id, 
            e.title, 
            e.start_time,
            e.thumbnail_url,
            SUM(tt.sold_quantity) as total_tickets_sold,
            SUM(tt.sold_quantity * tt.price) as total_revenue
        FROM events e
        LEFT JOIN ticket_types tt ON e.event_id = tt.event_id
        WHERE e.organizer_id = ?
        GROUP BY e.event_id
        ORDER BY e.start_time DESC
    `;
    const [rows] = await db.execute(sql, [organizerId]);
    return rows;
  },

  // 1.5 Quản lý hồ sơ
  updateOrganizerProfile: async (userId, data) => {
    const sql = `UPDATE users SET organization_name = ?, full_name = ?, phone = ?, avatar_url = ? WHERE user_id = ?`;
    const [result] = await db.execute(sql, [data.organization_name, data.full_name, data.phone, data.avatar_url, userId]);
    return result;
  }

  
};


