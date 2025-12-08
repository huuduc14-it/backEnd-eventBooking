const User = require("../models/userModel");
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
  // ViewDetailEvent: (req, res) => {
  //   const event_id = req.params.id;
  //   User.getEventById(event_id, (err, result) => {
  //     if (err) {
  //       console.log("Lỗi khi lấy chi tiết sự kiện", err);
  //       return res.status(500).json({
  //         success: false,
  //         message: "Lỗi server",
  //       });
  //     }

  //     if (result.length === 0) {
  //       return res.status(404).json({
  //         success: false,
  //         message: "Không tìm thấy sự kiện",
  //       });
  //     }

  //     return res.status(200).json({
  //       success: true,
  //       data: result[0],
  //     });
  //   });
  // },
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

  getArtistsInfor: async (req, res) => {
    try {
      const event_id = req.params.event_id;
      const result = await User.getArtists(event_id);

      if (!result || result.length === 0) {
        return res
          .status(404)
          .json({ message: "không tìm thấy nghệ sĩ nào trong sự kiện" });
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
  // search: (req, res) => {
  //   const { keyword } = req.query;

  //   if (!keyword || keyword.trim() === "") {
  //     return res
  //       .status(400)
  //       .json({ message: "Vui lòng nhập từ khóa tìm kiếm" });
  //   }

  //   User.searchEvent(keyword, (err, results) => {
  //     if (err) {
  //       console.log(err);
  //       return res.status(500).json({ message: "Lỗi server" });
  //     }

  //     res.json({
  //       keyword,
  //       count: results.length,
  //       events: results,
  //     });
  //   });
  // },
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
};
