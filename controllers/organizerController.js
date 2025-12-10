const Organizer = require("../models/organizerModel");
const User = require("../models/userModel"); // Tái sử dụng để lấy thông tin user cơ bản
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

module.exports = {
  // 1.1 Đăng ký Organizer
  register: async (req, res) => {
    try {
      // const { organization_name } = req.body;
      const {
        organization_name,
        tax_code,
        address,
        bank_account,
        contact_email,
        contact_phone,
      } = req.body;
      const userId = req.user.user_id;

      if (
        !organization_name ||
        !tax_code ||
        !address ||
        !contact_email ||
        !contact_phone
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Vui lòng điền đầy đủ thông tin bắt buộc (Tên tổ chức, Mã số thuế, Địa chỉ, Email liên hệ, SĐT liên hệ)",
        });
      }

      const profileData = {
        organization_name,
        tax_code,
        address,
        bank_account: bank_account || null,
        contact_email,
        contact_phone,
      };

      await Organizer.registerOrganizer(userId, profileData);
      const newToken = jwt.sign(
        {
          user_id: userId,
          role: "organizer",
        },
        SECRET_KEY,
        { expiresIn: "7d" }
      );

      res.json({
        success: true,
        message:
          "Đăng ký Organizer thành công. Bạn có thể bắt đầu tạo sự kiện.",
        oken: newToken,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },

  // 1.2 & 1.3 Tạo sự kiện mới kèm vé
  createEvent: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const {
        title,
        description,
        start_time,
        location_name,
        thumbnail_url,
        category_id, // Thông tin sự kiện
        ticket_types, // Mảng vé: [{name: "VIP", price: 500000, quantity: 100}, ...]
      } = req.body;

      if (!title || !start_time || !ticket_types || ticket_types.length === 0) {
        return res.status(400).json({
          message: "Thiếu thông tin bắt buộc (Tên, thời gian hoặc loại vé)",
        });
      }

      const eventData = {
        title,
        description,
        start_time,
        location_name,
        thumbnail_url,
        category_id,
      };

      const newEventId = await Organizer.createEvent(
        userId,
        eventData,
        ticket_types
      );

      res.status(201).json({
        success: true,
        message: "Tạo sự kiện thành công",
        event_id: newEventId,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Lỗi server khi tạo sự kiện" });
    }
  },

  // 1.4 Xem dashboard thống kê
  getDashboard: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const stats = await Organizer.getEventStats(userId);
      res.json({ success: true, data: stats });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  // 1.5 Update Profile
  updateProfile: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const { organization_name, full_name, phone, avatar_url } = req.body;

      await Organizer.updateOrganizerProfile(userId, {
        organization_name,
        full_name,
        phone,
        avatar_url,
      });
      res.json({ success: true, message: "Cập nhật hồ sơ thành công" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Lỗi server" });
    }
  },
  updateEvent: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const eventId = req.params.event_id;
      const {
        title,
        description,
        start_time,
        location_name,
        thumbnail_url,
        category_id,
      } = req.body;

      const result = await Organizer.updateEvent(userId, eventId, {
        title,
        description,
        start_time,
        location_name,
        thumbnail_url,
        category_id,
      });

      if (result.affectedRows === 0) {
        return res
          .status(403)
          .json({ message: "Không có quyền sửa hoặc sự kiện không tồn tại" });
      }

      res.json({ success: true, message: "Cập nhật sự kiện thành công" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  // --- 2.3 Quản lý khách tham gia (View List) ---
  getAttendees: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const eventId = req.params.event_id;
      const attendees = await Organizer.getEventAttendees(userId, eventId);
      res.json({ success: true, data: attendees });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  // --- 2.3 Export Excel ---
  exportAttendeesExcel: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const eventId = req.params.event_id;
      const attendees = await Organizer.getEventAttendees(userId, eventId);

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Attendees");

      sheet.columns = [
        { header: "Họ Tên", key: "full_name", width: 25 },
        { header: "Email", key: "email", width: 25 },
        { header: "SĐT", key: "phone", width: 15 },
        { header: "Loại Vé", key: "ticket_type", width: 20 },
        { header: "Mã QR", key: "qr_code", width: 30 },
        { header: "Ngày mua", key: "booking_date", width: 20 },
      ];

      attendees.forEach((att) => {
        sheet.addRow(att);
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=attendees_event_${eventId}.xlsx`
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Lỗi xuất Excel" });
    }
  },

  // --- 2.3 Export PDF ---
  exportAttendeesPDF: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const eventId = req.params.event_id;
      const attendees = await Organizer.getEventAttendees(userId, eventId);

      const doc = new PDFDocument();

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=attendees_event_${eventId}.pdf`
      );

      doc.pipe(res);

      doc
        .fontSize(20)
        .text(`Danh sách tham gia - Sự kiện #${eventId}`, { align: "center" });
      doc.moveDown();

      attendees.forEach((att, index) => {
        doc
          .fontSize(12)
          .text(
            `${index + 1}. ${att.full_name} - ${att.ticket_type} (${
              att.qr_code
            })`
          );
        doc.fontSize(10).text(`   Email: ${att.email} | SĐT: ${att.phone}`);
        doc.moveDown(0.5);
      });

      doc.end();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Lỗi xuất PDF" });
    }
  },

  // --- 2.2 Import Excel & Auto Generate Tickets ---
  importAttendees: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Vui lòng upload file Excel" });
      }

      const userId = req.user.user_id;
      const eventId = req.body.event_id;
      const ticketTypeId = req.body.ticket_type_id; // Loại vé gán cho danh sách này
      const price = req.body.price || 0;

      // Đọc file Excel từ buffer
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer);
      const worksheet = workbook.getWorksheet(1);

      const attendeesToImport = [];

      // Giả sử cột A là User ID (trong thực tế cần map email -> user_id, ở đây làm đơn giản theo user_id có sẵn)
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          // Bỏ qua header
          const userId = row.getCell(1).value;
          if (userId) {
            attendeesToImport.push({
              user_id: userId,
              ticket_type_id: ticketTypeId,
              price: price,
            });
          }
        }
      });

      if (attendeesToImport.length > 0) {
        await Organizer.createBulkBookings(userId, eventId, attendeesToImport);
        return res.json({
          success: true,
          message: `Đã import thành công ${attendeesToImport.length} vé.`,
        });
      }

      res.json({
        success: false,
        message: "File rỗng hoặc không đúng định dạng",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message || "Lỗi Import" });
    }
  },
};
