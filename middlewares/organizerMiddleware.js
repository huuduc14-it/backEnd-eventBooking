const db = require("../config/db");

// Kiểm tra user có phải organizer đã được xác minh chưa
module.exports = async (req, res, next) => {
  try {
    if (!req.user || !req.user.user_id) {
      return res
        .status(401)
        .json({ success: false, message: "Thiếu thông tin người dùng" });
    }

    const userId = req.user.user_id;
    const [userRows] = await db.execute(
      "SELECT role, organizer_profile_completed FROM users WHERE user_id = ?",
      [userId]
    );

    if (userRows.length === 0) {
      return res
        .status(403)
        .json({ success: false, message: "Người dùng không tồn tại" });
    }

    const user = userRows[0];
    if (user.role !== "organizer" || !user.organizer_profile_completed) {
      return res.status(403).json({
        success: false,
        message:
          "Bạn chưa đăng ký tài khoản tổ chức hoặc chưa hoàn thành hồ sơ",
      });
    }

    // Gán organizerId để controller dùng
    const [profileRows] = await db.execute(
      "SELECT profile_id FROM organizer_profiles WHERE user_id = ?",
      [userId]
    );

    if (profileRows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Không tìm thấy hồ sơ tổ chức",
      });
    }

    // Cho phép tiếp tục
    next();
  } catch (err) {
    console.error("Organizer middleware error", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
