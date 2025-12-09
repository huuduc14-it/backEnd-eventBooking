// models/organizerModel.js
const db = require("../config/db");

// Helper: sinh QR code đơn giản cho mỗi vé
const generateQr = () => `QR-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

module.exports = {
  // 1.1 Đăng ký làm Organizer (ghi vào bảng organizer_profiles)
  registerOrganizer: async (userId, profileData) => {
    const { organization_name, tax_code, address, bank_account, contact_email, contact_phone } = profileData;
    
    // Insert organizer profile với đầy đủ thông tin
    const sql = `
      INSERT INTO organizer_profiles 
        (user_id, organization_name, tax_code, address, bank_account, contact_email, contact_phone)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        organization_name = VALUES(organization_name),
        tax_code = VALUES(tax_code),
        address = VALUES(address),
        bank_account = VALUES(bank_account),
        contact_email = VALUES(contact_email),
        contact_phone = VALUES(contact_phone)
    `;
    const [result] = await db.execute(sql, [
      userId, organization_name, tax_code, address, bank_account, contact_email, contact_phone
    ]);
    
    // Cập nhật role trong bảng users thành 'organizer'
    await db.execute(
      "UPDATE users SET role = 'organizer', organizer_profile_completed = TRUE WHERE user_id = ?",
      [userId]
    );
    
    return result;
  },

  // Lấy organizer profile từ user_id
  getOrganizerByUser: async (userId) => {
    const [rows] = await db.execute(
      "SELECT profile_id, organization_name, tax_code, address, bank_account, contact_email, contact_phone FROM organizer_profiles WHERE user_id = ?",
      [userId]
    );
    return rows[0] || null;
  },

  // 1.2 & 1.3 Tạo sự kiện & Vé
  createEvent: async (userId, eventData, ticketTypes) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Insert Event với user_id (người tạo event)
      const eventSql = `
        INSERT INTO events (title, description, start_time, location_name, thumbnail_url, category_id, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      const [eventResult] = await connection.execute(eventSql, [
        eventData.title,
        eventData.description,
        eventData.start_time,
        eventData.location_name,
        eventData.thumbnail_url,
        eventData.category_id,
        userId,
      ]);
      const newEventId = eventResult.insertId;

      // Insert Ticket Types (Quản lý loại vé)
      if (ticketTypes && ticketTypes.length > 0) {
        const ticketSql = `INSERT INTO ticket_types (event_id, name, price, total_quantity, remaining, description) VALUES ?`;
        const ticketValues = ticketTypes.map((t) => [
          newEventId,
          t.name,
          t.price,
          t.quantity,
          t.quantity, // remaining ban đầu bằng total
          t.description || null,
        ]);
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
  getEventStats: async (userId) => {
    const sql = `
      SELECT 
        e.event_id,
        e.title,
        e.description,
        e.start_time,
        e.location_name as location,
        e.thumbnail_url,
        e.thumbnail_url as image_url,
        e.category_id,
        COALESCE(SUM(tt.total_quantity - tt.remaining), 0) AS total_tickets_sold,
        COALESCE(SUM((tt.total_quantity - tt.remaining) * tt.price), 0) AS total_revenue
      FROM events e
      LEFT JOIN ticket_types tt ON e.event_id = tt.event_id
      WHERE e.user_id = ?
      GROUP BY e.event_id, e.title, e.description, e.start_time, e.location_name, e.thumbnail_url, e.category_id
      ORDER BY e.start_time DESC
    `;
    const [rows] = await db.execute(sql, [userId]);
    return rows;
  },

  // 1.5 Quản lý hồ sơ
  updateOrganizerProfile: async (userId, data) => {
    // Thông tin tổ chức lưu ở bảng organizer_profiles, thông tin cá nhân ở users
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Cập nhật organizer_profiles
      if (data.organization_name || data.tax_code || data.address || data.bank_account || data.contact_email || data.contact_phone) {
        const updates = [];
        const values = [];
        
        if (data.organization_name) {
          updates.push('organization_name = ?');
          values.push(data.organization_name);
        }
        if (data.tax_code) {
          updates.push('tax_code = ?');
          values.push(data.tax_code);
        }
        if (data.address) {
          updates.push('address = ?');
          values.push(data.address);
        }
        if (data.bank_account) {
          updates.push('bank_account = ?');
          values.push(data.bank_account);
        }
        if (data.contact_email) {
          updates.push('contact_email = ?');
          values.push(data.contact_email);
        }
        if (data.contact_phone) {
          updates.push('contact_phone = ?');
          values.push(data.contact_phone);
        }
        
        if (updates.length > 0) {
          values.push(userId);
          await conn.execute(
            `UPDATE organizer_profiles SET ${updates.join(', ')} WHERE user_id = ?`,
            values
          );
        }
      }

      // Cập nhật users
      if (data.full_name || data.phone || data.avatar_url) {
        const updates = [];
        const values = [];
        
        if (data.full_name) {
          updates.push('full_name = ?');
          values.push(data.full_name);
        }
        if (data.phone) {
          updates.push('phone = ?');
          values.push(data.phone);
        }
        if (data.avatar_url) {
          updates.push('avatar_url = ?');
          values.push(data.avatar_url);
        }
        
        if (updates.length > 0) {
          values.push(userId);
          await conn.execute(
            `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
            values
          );
        }
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  // Kiểm tra quyền sở hữu sự kiện
  ensureEventOwner: async (userId, eventId) => {
    const [rows] = await db.execute(
      `SELECT event_id FROM events WHERE event_id = ? AND user_id = ?`,
      [eventId, userId]
    );
    return rows.length > 0;
  },

  // Cập nhật sự kiện (thông tin cơ bản)
  updateEvent: async (userId, eventId, data) => {
    const isOwner = await module.exports.ensureEventOwner(userId, eventId);
    if (!isOwner) return { affectedRows: 0 };

    const [result] = await db.execute(
      `UPDATE events SET title = ?, description = ?, start_time = ?, location_name = ?, thumbnail_url = ?, category_id = ?
       WHERE event_id = ? AND user_id = ?`,
      [
        data.title,
        data.description,
        data.start_time,
        data.location_name,
        data.thumbnail_url,
        data.category_id,
        eventId,
        userId,
      ]
    );
    return result;
  },

  // Lấy danh sách người tham gia một sự kiện (đã mua vé)
  getEventAttendees: async (userId, eventId) => {
    const isOwner = await module.exports.ensureEventOwner(userId, eventId);
    if (!isOwner) return [];

    const sql = `
      SELECT 
        u.full_name,
        u.email,
        u.phone,
        tt.name AS ticket_type,
        bi.price,
        t.qr_code,
        b.created_at AS booking_date
      FROM bookings b
      JOIN booking_items bi ON b.booking_id = bi.booking_id
      JOIN tickets t ON t.booking_item = bi.item_id
      JOIN ticket_types tt ON bi.ticket_type_id = tt.ticket_type_id
      JOIN users u ON b.user_id = u.user_id
      WHERE b.event_id = ?
      ORDER BY b.created_at DESC
    `;
    const [rows] = await db.execute(sql, [eventId]);
    return rows;
  },

  // Import hàng loạt: tạo booking + ticket cho mỗi attendee
  createBulkBookings: async (userId, eventId, attendees) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const isOwner = await module.exports.ensureEventOwner(userId, eventId);
      if (!isOwner) {
        throw new Error("Không có quyền với sự kiện này");
      }

      // Gom số lượng theo ticket_type để kiểm tra tồn kho
      const typeCounts = attendees.reduce((acc, cur) => {
        const key = cur.ticket_type_id;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      for (const [ticketTypeId, count] of Object.entries(typeCounts)) {
        const [[info]] = await connection.execute(
          `SELECT remaining FROM ticket_types WHERE ticket_type_id = ? AND event_id = ? FOR UPDATE`,
          [ticketTypeId, eventId]
        );
        if (!info) throw new Error("Loại vé không thuộc sự kiện");
        if (info.remaining < count) throw new Error("Số vé còn lại không đủ");
      }

      for (const attendee of attendees) {
        // booking
        const [bookingResult] = await connection.execute(
          `INSERT INTO bookings (user_id, event_id, total_amount, payment_status)
           VALUES (?, ?, ?, 'paid')`,
          [attendee.user_id, eventId, attendee.price]
        );
        const bookingId = bookingResult.insertId;

        // booking item
        const [itemResult] = await connection.execute(
          `INSERT INTO booking_items (booking_id, ticket_type_id, price)
           VALUES (?, ?, ?)`,
          [bookingId, attendee.ticket_type_id, attendee.price]
        );
        const itemId = itemResult.insertId;

        // ticket
        await connection.execute(
          `INSERT INTO tickets (booking_item, qr_code, is_used) VALUES (?, ?, FALSE)`,
          [itemId, generateQr()]
        );

        // trừ remaining
        await connection.execute(
          `UPDATE ticket_types SET remaining = remaining - 1 WHERE ticket_type_id = ?`,
          [attendee.ticket_type_id]
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
};


