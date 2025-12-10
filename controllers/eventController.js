const User = require("../models/userModel");
const SeatModel = require("../models/seatModel");
const EventModel = require("../models/eventModel");
const TicketTypeModel = require("../models/ticket_type_Model");

module.exports = {
  ViewAllEvent: async (req, res) => {
    try {
      const events = await User.getAllEvent();
      res.status(200).json({
        success: true,
        data: events,
      });
    } catch (err) {
      console.error("Lỗi lấy danh sách sự kiện", err);
      res.status(500).json({
        success: false,
        message: "Lỗi server, không lấy được danh sách sự kiện",
      });
    }
  },
  ViewDetailEvent: async (req, res) => {
    try {
      const event_id = req.params.id;
      const result = await User.getEventById(event_id);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy sự kiện",
        });
      }

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      console.error("Lỗi khi lấy chi tiết sự kiện", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  },

  // getArtistsInfor: (req, res) => {
  //   const event_id = req.params.event_id;
  //   User.getArtists(event_id, (err, result) => {
  //     if (err) {
  //       return res.status(500).json({ message: "Lối server" });
  //     }

  //     if (!result || result.length === 0) {
  //       return res
  //         .status(404)
  //         .json({ message: "không tìm thấy nghệ sĩ nào trong sự kiện" });
  //     }

  //     return res.status(200).json({
  //       message: "lấy danh sách nghệ sĩ thành công",
  //       artists: result,
  //     });
  //   });
  // },
  getArtistsInfor: async (req, res) => {
    try {
      const event_id = req.params.event_id;

      const result = await User.getArtists(event_id);

      if (!result || result.length === 0) {
        return res.status(404).json({
          message: "không tìm thấy nghệ sĩ nào trong sự kiện",
        });
      }

      return res.status(200).json({
        message: "lấy danh sách nghệ sĩ thành công",
        artists: result,
      });
    } catch (err) {
      console.error("GET ARTISTS ERROR", err);
      return res.status(500).json({ message: "Lỗi server" });
    }
  },
  search: async (req, res) => {
    try {
      const { keyword, date, category_id } = req.query;

      // Nếu không nhập gì cũng không trả lỗi, chỉ trả về tất cả
      // hoặc tùy bạn có muốn bắt ít nhất 1 filter
      const results = await User.searchEvent(keyword, date, category_id);

      res.json({
        keyword: keyword || null,
        category_id: category_id || null,
        date: date || null,
        count: results.length,
        events: results,
      });
    } catch (error) {
      console.error("Lỗi tìm kiếm sự kiện:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  },
  // requestCreateEvent: async (req, res) => {
  //   try {
  //     const {
  //       title,
  //       description,
  //       location_name,
  //       address,
  //       start_time,
  //       end_time,
  //       thumbnail_url,
  //       category_id,
  //       artist_ids,
  //       tickets,
  //     } = req.body;

  //     if (
  //       !title ||
  //       !start_time ||
  //       !category_id ||
  //       !tickets ||
  //       tickets.length === 0
  //     ) {
  //       return res.status(400).json({
  //         message:
  //           "Missing required fields (Title, Time, Category, or Tickets)",
  //       });
  //     }
  //     const userId = req.user.user_id;

  //     const newEventId = await EventModel.createFullEvent({
  //       userId,
  //       category_id,
  //       title,
  //       description,
  //       location_name,
  //       address,
  //       start_time,
  //       end_time,
  //       thumbnail_url,
  //       artist_ids,
  //       tickets,
  //     });

  //     return res.status(201).json({
  //       msg: "Event Created",
  //       newEventId: newEventId,
  //     });
  //   } catch (err) {
  //     console.error(err);
  //     return res
  //       .status(500)
  //       .json({ message: "Database transaction failed", error: err.message });
  //   }
  // },
  getEventSeats: async (req, res) => {
    try {
      const { id } = req.params;
      const seats = await SeatModel.getEventSeats(id);

      return res.json({ success: true, data: seats });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },
  getEventTickets: async (req, res) => {
    try {
      const eventId = req.params.id;
      const tickets = await TicketTypeModel.getByEventId(eventId);

      return res.json({
        success: true,
        data: tickets,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },
  requestCreateEvent: async (req, res) => {
    try {
      const {
        title,
        description,
        location_name,
        address,
        start_time,
        end_time,
        thumbnail_url,
        category_id,
        artist_ids,
        tickets,
      } = req.body;
      s;
      if (
        !title ||
        !start_time ||
        !category_id ||
        !tickets ||
        tickets.length === 0
      ) {
        return res.status(400).json({
          message:
            "Missing required fields (Title, Time, Category, or Tickets)",
        });
      }

      const userId = req.user.user_id;

      // 1. Tạo Event
      const newEventId = await EventModel.createFullEvent({
        userId,
        category_id,
        title,
        description,
        location_name,
        address,
        start_time,
        end_time,
        thumbnail_url,
        artist_ids,
        tickets,
      });

      // 2. Cập nhật role thành "organizer"
      const User = require("../models/userModel"); // import nếu chưa import
      await User.updateRole(userId, "organizer");

      return res.status(201).json({
        msg: "Event Created and role updated to organizer",
        newEventId: newEventId,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        message: "Database transaction failed",
        error: err.message,
      });
    }
  },
};
