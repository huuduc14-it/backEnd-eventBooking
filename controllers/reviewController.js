const Review = require("../models/reviewModel");

module.exports = {
  // createReview: (req, res) => {
  //   const user_id = req.user.id; // lấy từ token
  //   const { event_id, rating, comment } = req.body;

  //   if (!event_id || !rating) {
  //     return res
  //       .status(400)
  //       .json({ message: "event_id và rating là bắt buộc!" });
  //   }

  //   Review.createReview(user_id, event_id, rating, comment, (err, result) => {
  //     if (err) {
  //       console.error("Error creating review:", err);
  //       return res.status(500).json({ message: "Lỗi server" });
  //     }

  //     return res.status(201).json({
  //       message: "Tạo review thành công!",
  //       review_id: result.insertId,
  //     });
  //   });
  // },
  createReview: async (req, res) => {
    try {
      const user_id = req.user.user_id; // lấy từ token
      const { event_id, rating, comment } = req.body;

      if (!event_id || !rating) {
        return res
          .status(400)
          .json({ message: "event_id và rating là bắt buộc!" });
      }

      const result = await Review.createReview(
        user_id,
        event_id,
        rating,
        comment
      );

      return res.status(201).json({
        message: "Tạo review thành công!",
        review_id: result.insertId,
      });
    } catch (err) {
      console.error("Error creating review:", err);
      return res.status(500).json({ message: "Lỗi server" });
    }
  },

  getReviewsByEvent: async (req, res) => {
    try {
      const event_id = req.params.event_id;

      // Gọi model async
      const reviews = await Review.getReviewsByEvent(event_id);

      return res.status(200).json({
        success: true,
        total: reviews.length,
        data: reviews,
      });
    } catch (err) {
      console.error("Error fetching reviews:", err);
      return res.status(500).json({ message: "Lỗi server" });
    }
  },
};
