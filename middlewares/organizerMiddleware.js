module.exports = (req, res, next) => {
    // req.user đã có từ authMiddleware chạy trước đó
    if (!req.user || req.user.role !== 'organizer') {
        return res.status(403).json({ 
            success: false, 
            message: "Bạn không có quyền truy cập chức năng này (Yêu cầu quyền Organizer)" 
        });
    }
    next();
};