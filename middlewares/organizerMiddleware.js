const db = require("../config/db");

// Kiểm tra user có phải organizer đã được xác minh chưa
module.exports = async (req, res, next) => {
    try {
        if (!req.user || !req.user.user_id) {
            return res.status(401).json({ success: false, message: "Thiếu thông tin người dùng" });
        }

        const userId = req.user.user_id;
        const [rows] = await db.execute(
            "SELECT organizer_id, verified FROM organizers WHERE user_id = ?",
            [userId]
        );

        if (rows.length === 0) {
            return res.status(403).json({ success: false, message: "Bạn chưa đăng ký tài khoản tổ chức" });
        }

        const organizer = rows[0];
        if (!organizer.verified) {
            return res.status(403).json({ success: false, message: "Tài khoản tổ chức chưa được xác minh" });
        }

        // Gán organizerId để controller dùng
        req.organizerId = organizer.organizer_id;
        next();
    } catch (err) {
        console.error("Organizer middleware error", err);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};