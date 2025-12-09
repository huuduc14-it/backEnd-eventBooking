// models/bookingModel.js
const db = require("../config/db");

// Helper: sinh QR code
const generateQr = () => `QR-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

module.exports = {
  // Lấy thông tin ticket_types của event
  getTicketTypesByEvent: async (eventId) => {
    const [rows] = await db.execute(
      `SELECT ticket_type_id, name, price, total_quantity, remaining, description 
       FROM ticket_types 
       WHERE event_id = ?`,
      [eventId]
    );
    return rows;
  },

  // Tạo booking mới (User đặt vé)
  createBooking: async (userId, eventId, items) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Tính tổng tiền và kiểm tra tồn kho
      let totalAmount = 0;
      const ticketTypeCounts = {};

      for (const item of items) {
        // Lock row để tránh race condition
        const [[ticketType]] = await connection.execute(
          `SELECT ticket_type_id, price, remaining 
           FROM ticket_types 
           WHERE ticket_type_id = ? AND event_id = ? 
           FOR UPDATE`,
          [item.ticket_type_id, eventId]
        );

        if (!ticketType) {
          throw new Error(`Loại vé ${item.ticket_type_id} không tồn tại`);
        }

        if (ticketType.remaining < item.quantity) {
          throw new Error(`Loại vé ${item.ticket_type_id} chỉ còn ${ticketType.remaining} vé`);
        }

        totalAmount += ticketType.price * item.quantity;
        ticketTypeCounts[item.ticket_type_id] = {
          ...ticketType,
          quantity: item.quantity,
        };
      }

      // Tạo booking
      const [bookingResult] = await connection.execute(
        `INSERT INTO bookings (user_id, event_id, total_amount, payment_status, created_at)
         VALUES (?, ?, ?, 'pending', NOW())`,
        [userId, eventId, totalAmount]
      );
      const bookingId = bookingResult.insertId;

      // Tạo booking_items và tickets
      for (const [ticketTypeId, info] of Object.entries(ticketTypeCounts)) {
        for (let i = 0; i < info.quantity; i++) {
          // Tạo booking_item
          const [itemResult] = await connection.execute(
            `INSERT INTO booking_items (booking_id, ticket_type_id, seat_id, price)
             VALUES (?, ?, NULL, ?)`,
            [bookingId, ticketTypeId, info.price]
          );
          const itemId = itemResult.insertId;

          // Tạo ticket với QR code
          await connection.execute(
            `INSERT INTO tickets (booking_item, qr_code, is_used)
             VALUES (?, ?, FALSE)`,
            [itemId, generateQr()]
          );
        }

        // Trừ số lượng vé còn lại
        await connection.execute(
          `UPDATE ticket_types 
           SET remaining = remaining - ? 
           WHERE ticket_type_id = ?`,
          [info.quantity, ticketTypeId]
        );
      }

      await connection.commit();
      return { bookingId, totalAmount };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Cập nhật trạng thái thanh toán
  updatePaymentStatus: async (bookingId, status) => {
    const [result] = await db.execute(
      `UPDATE bookings SET payment_status = ? WHERE booking_id = ?`,
      [status, bookingId]
    );
    return result;
  },

  // Lấy thông tin booking
  getBookingById: async (bookingId) => {
    const [rows] = await db.execute(
      `SELECT b.*, e.title as event_title, e.start_time, e.location_name
       FROM bookings b
       JOIN events e ON b.event_id = e.event_id
       WHERE b.booking_id = ?`,
      [bookingId]
    );
    return rows[0] || null;
  },

  // Lấy tickets của booking
  getTicketsByBooking: async (bookingId) => {
    const [rows] = await db.execute(
      `SELECT t.ticket_id, t.qr_code, t.is_used, 
              tt.name as ticket_type_name, bi.price
       FROM tickets t
       JOIN booking_items bi ON t.booking_item = bi.item_id
       JOIN ticket_types tt ON bi.ticket_type_id = tt.ticket_type_id
       WHERE bi.booking_id = ?`,
      [bookingId]
    );
    return rows;
  },

  // Check-in vé bằng QR code
  checkInTicket: async (qrCode) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Lấy thông tin ticket
      const [[ticket]] = await connection.execute(
        `SELECT t.ticket_id, t.qr_code, t.is_used,
                e.event_id, e.title as event_title, e.start_time,
                u.full_name, u.email, u.phone,
                tt.name as ticket_type_name, bi.price
         FROM tickets t
         JOIN booking_items bi ON t.booking_item = bi.item_id
         JOIN bookings b ON bi.booking_id = b.booking_id
         JOIN events e ON b.event_id = e.event_id
         JOIN users u ON b.user_id = u.user_id
         JOIN ticket_types tt ON bi.ticket_type_id = tt.ticket_type_id
         WHERE t.qr_code = ?
         FOR UPDATE`,
        [qrCode]
      );

      if (!ticket) {
        throw new Error("QR code không hợp lệ");
      }

      if (ticket.is_used) {
        throw new Error("Vé đã được sử dụng");
      }

      // Kiểm tra thời gian sự kiện (tùy chọn)
      const eventTime = new Date(ticket.start_time);
      const now = new Date();
      const hoursDiff = (eventTime - now) / (1000 * 60 * 60);
      
      if (hoursDiff < -6) {
        throw new Error("Sự kiện đã kết thúc hơn 6 giờ");
      }

      // Cập nhật trạng thái vé
      await connection.execute(
        `UPDATE tickets SET is_used = TRUE WHERE ticket_id = ?`,
        [ticket.ticket_id]
      );

      await connection.commit();
      return {
        success: true,
        ticket: ticket,
        message: "Check-in thành công"
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Hủy booking (chỉ được hủy khi chưa thanh toán hoặc trước 24h)
  cancelBooking: async (bookingId, userId) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Lấy thông tin booking
      const [[booking]] = await connection.execute(
        `SELECT b.booking_id, b.user_id, b.event_id, b.payment_status, 
                e.start_time
         FROM bookings b
         JOIN events e ON b.event_id = e.event_id
         WHERE b.booking_id = ? AND b.user_id = ?
         FOR UPDATE`,
        [bookingId, userId]
      );

      if (!booking) {
        throw new Error("Không tìm thấy booking hoặc không có quyền hủy");
      }

      if (booking.payment_status === 'failed') {
        throw new Error("Booking đã bị hủy");
      }

      // Kiểm tra thời gian (phải hủy trước 24h)
      const eventTime = new Date(booking.start_time);
      const now = new Date();
      const hoursDiff = (eventTime - now) / (1000 * 60 * 60);

      if (hoursDiff < 24) {
        throw new Error("Chỉ có thể hủy vé trước 24 giờ diễn ra sự kiện");
      }

      // Lấy danh sách ticket_type_id và số lượng
      const [items] = await connection.execute(
        `SELECT ticket_type_id, COUNT(*) as quantity
         FROM booking_items
         WHERE booking_id = ?
         GROUP BY ticket_type_id`,
        [bookingId]
      );

      // Hoàn trả số lượng vé
      for (const item of items) {
        await connection.execute(
          `UPDATE ticket_types 
           SET remaining = remaining + ? 
           WHERE ticket_type_id = ?`,
          [item.quantity, item.ticket_type_id]
        );
      }

      // Cập nhật trạng thái booking
      await connection.execute(
        `UPDATE bookings SET payment_status = 'failed' WHERE booking_id = ?`,
        [bookingId]
      );

      await connection.commit();
      return {
        success: true,
        message: "Hủy vé thành công. Số tiền sẽ được hoàn trả trong 3-5 ngày làm việc."
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Cập nhật số lượng vé (Organizer)
  updateTicketQuantity: async (userId, ticketTypeId, newQuantity) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Kiểm tra quyền sở hữu
      const [[ticketType]] = await connection.execute(
        `SELECT tt.ticket_type_id, tt.event_id, tt.total_quantity, tt.remaining,
                e.user_id as organizer_id
         FROM ticket_types tt
         JOIN events e ON tt.event_id = e.event_id
         WHERE tt.ticket_type_id = ?
         FOR UPDATE`,
        [ticketTypeId]
      );

      if (!ticketType) {
        throw new Error("Loại vé không tồn tại");
      }

      if (ticketType.organizer_id !== userId) {
        throw new Error("Không có quyền chỉnh sửa");
      }

      const soldQuantity = ticketType.total_quantity - ticketType.remaining;

      if (newQuantity < soldQuantity) {
        throw new Error(`Không thể giảm xuống dưới ${soldQuantity} vé (số vé đã bán)`);
      }

      const newRemaining = newQuantity - soldQuantity;

      await connection.execute(
        `UPDATE ticket_types 
         SET total_quantity = ?, remaining = ?
         WHERE ticket_type_id = ?`,
        [newQuantity, newRemaining, ticketTypeId]
      );

      await connection.commit();
      return {
        success: true,
        message: "Cập nhật số lượng vé thành công"
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Lấy danh sách bookings của user
  getBookingsByUser: async (userId) => {
    const [rows] = await db.execute(
      `SELECT b.booking_id, b.total_amount, b.payment_status, b.created_at,
              e.event_id, e.title as event_title, e.start_time, e.thumbnail_url,
              COUNT(t.ticket_id) as ticket_count
       FROM bookings b
       JOIN events e ON b.event_id = e.event_id
       LEFT JOIN booking_items bi ON b.booking_id = bi.booking_id
       LEFT JOIN tickets t ON bi.item_id = t.booking_item
       WHERE b.user_id = ?
       GROUP BY b.booking_id
       ORDER BY b.created_at DESC`,
      [userId]
    );
    return rows;
  }
};
