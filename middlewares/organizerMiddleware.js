const db = require("../config/db");

// Kiểm tra user có phải organizer (có hồ sơ trong organizer_profiles) chưa
module.exports = async (req, res, next) => {
    try {
        if (!req.user || !req.user.user_id) {
            return res.status(401).json({ success: false, message: "Thiếu thông tin người dùng" });
        }

        const userId = req.user.user_id;
        
        // Kiểm tra user có role organizer trong bảng users
        const [userRows] = await db.execute(
            "SELECT role, organizer_profile_completed FROM users WHERE user_id = ?",
            [userId]
        );

        if (userRows.length === 0) {
            return res.status(403).json({ success: false, message: "Người dùng không tồn tại" });
        }

        const user = userRows[0];
        if (user.role !== 'organizer' || !user.organizer_profile_completed) {
            return res.status(403).json({ 
                success: false, 
                message: "Bạn chưa đăng ký tài khoản tổ chức hoặc chưa hoàn thành hồ sơ" 
            });
        }

        // Kiểm tra organizer_profiles có tồn tại
        const [profileRows] = await db.execute(
            "SELECT profile_id FROM organizer_profiles WHERE user_id = ?",
            [userId]
        );

        if (profileRows.length === 0) {
            return res.status(403).json({ 
                success: false, 
                message: "Không tìm thấy hồ sơ tổ chức" 
            });
        }

        // Cho phép tiếp tục
        next();
    } catch (err) {
        console.error("Organizer middleware error", err);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};