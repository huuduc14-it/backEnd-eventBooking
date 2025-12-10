const Booking = require("../models/bookingModelNew");

module.exports = {
  // Lấy thông tin các loại vé của event
  getTicketTypes: async (req, res) => {
    try {
      const eventId = req.params.event_id;
      const ticketTypes = await Booking.getTicketTypesByEvent(eventId);

      res.json({
        success: true,
        data: ticketTypes,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },

  // Tạo booking mới (User đặt vé)
  createBooking: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const { event_id, items } = req.body;

      // Validate input
      if (!event_id || !items || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin event_id hoặc items",
        });
      }

      // Validate items format: [{ticket_type_id, quantity}, ...]
      for (const item of items) {
        if (!item.ticket_type_id || !item.quantity || item.quantity < 1) {
          return res.status(400).json({
            success: false,
            message:
              "Format items không hợp lệ. Cần: [{ticket_type_id, quantity}]",
          });
        }
      }

      const result = await Booking.createBooking(userId, event_id, items);

      // Lấy thông tin booking và tickets
      const booking = await Booking.getBookingById(result.bookingId);
      const tickets = await Booking.getTicketsByBooking(result.bookingId);

      res.status(201).json({
        success: true,
        message: "Đặt vé thành công",
        data: {
          booking_id: result.bookingId,
          total_amount: result.totalAmount,
          payment_status: "pending",
          booking_info: booking,
          tickets: tickets,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: err.message || "Lỗi khi đặt vé",
      });
    }
  },

  // Xác nhận thanh toán (Mock - thực tế sẽ là webhook từ payment gateway)
  confirmPayment: async (req, res) => {
    try {
      const { booking_id } = req.body;
      const userId = req.user.user_id;

      // Kiểm tra booking thuộc user
      const booking = await Booking.getBookingById(booking_id);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy booking",
        });
      }

      if (booking.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: "Không có quyền truy cập booking này",
        });
      }

      // Cập nhật trạng thái thanh toán
      await Booking.updatePaymentStatus(booking_id, "paid");

      res.json({
        success: true,
        message: "Thanh toán thành công",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Lỗi xác nhận thanh toán",
      });
    }
  },

  // Lấy danh sách bookings của user
  getMyBookings: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const bookings = await Booking.getBookingsByUser(userId);

      res.json({
        success: true,
        data: bookings,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  },

  // Lấy chi tiết booking
  getBookingDetail: async (req, res) => {
    try {
      const bookingId = req.params.booking_id;
      const userId = req.user.user_id;

      const booking = await Booking.getBookingById(bookingId);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy booking",
        });
      }

      if (booking.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: "Không có quyền truy cập",
        });
      }

      const tickets = await Booking.getTicketsByBooking(bookingId);

      res.json({
        success: true,
        data: {
          ...booking,
          tickets: tickets,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  },

  // Check-in vé bằng QR code
  checkInTicket: async (req, res) => {
    try {
      const { qr_code } = req.body;

      if (!qr_code) {
        return res.status(400).json({
          success: false,
          message: "Thiếu qr_code",
        });
      }

      const result = await Booking.checkInTicket(qr_code);

      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(400).json({
        success: false,
        message: err.message || "Lỗi check-in",
      });
    }
  },

  // Hủy booking
  cancelBooking: async (req, res) => {
    try {
      const bookingId = req.params.booking_id;
      const userId = req.user.user_id;

      const result = await Booking.cancelBooking(bookingId, userId);

      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(400).json({
        success: false,
        message: err.message || "Lỗi khi hủy vé",
      });
    }
  },

  // Cập nhật số lượng vé (Organizer only)
  updateTicketQuantity: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const { ticket_type_id, new_quantity } = req.body;

      if (!ticket_type_id || !new_quantity || new_quantity < 0) {
        return res.status(400).json({
          success: false,
          message: "Thiếu ticket_type_id hoặc new_quantity không hợp lệ",
        });
      }

      const result = await Booking.updateTicketQuantity(
        userId,
        ticket_type_id,
        new_quantity
      );

      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(400).json({
        success: false,
        message: err.message || "Lỗi cập nhật số lượng vé",
      });
    }
  },
};
