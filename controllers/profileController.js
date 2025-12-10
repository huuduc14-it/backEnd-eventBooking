const Profile = require("../models/profileModel");
const db = require("../config/db"); // đường dẫn tới db.js

module.exports = {
  getProfile: async (req, res) => {
    try {
      const userId = req.user.user_id; // hoặc req.user.user_id tùy token

      if (!userId) {
        return res
          .status(400)
          .json({ success: false, message: "User ID missing" });
      }

      // Lấy thông tin user
      const [userRows] = await db.execute(
        "SELECT user_id, full_name, email, avatar_url, phone, role FROM users WHERE user_id = ?",
        [userId]
      );

      if (userRows.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "User không tồn tại" });
      }

      // Lấy danh sách vé nếu có
      // const [ticketRows] = await db.execute(
      //   "SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC",
      //   [userId]
      // );

      return res.json({
        success: true,
        user: userRows[0],
        // tickets: ticketRows,
      });
    } catch (err) {
      console.error("PROFILE ERROR:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  },
  // getProfile: async (req, res) => {
  //   try {
  //     const userId = req.user.id; // lấy từ middleware
  //     // 1) Lấy thông tin user
  //     const [userRow] = await db.execute(
  //       "SELECT user_id, full_name, email, avatar_url, phone FROM users WHERE user_id = ?",
  //       [userId]
  //     );
  //     const user = userRow[0];
  //     if (!user) {
  //       return res.status(404).json({
  //         success: false,
  //         message: "User không tồn tại",
  //       });
  //     }
  //     // 2) Lấy danh sách vé đã mua
  //     // const [tickets] = await db.execute(
  //     //   "SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC",
  //     //   [userId]
  //     // );
  //     return res.json({
  //       success: true,
  //       user,
  //     });
  //   } catch (err) {
  //     console.error("PROFILE ERROR:", err);
  //     return res.status(500).json({
  //       success: false,
  //       message: "Server error",
  //     });
  //   }
  // },
};
