const express = require("express");
const router = express.Router();
const organizerController = require("../controllers/organizerController");
const authMiddleware = require("../middlewares/authMiddleware");
const organizerMiddleware = require("../middlewares/organizerMiddleware");
const upload = require("../middlewares/uploadMiddleware");
router.use(authMiddleware);
router.post("/register", organizerController.register);
router.use(organizerMiddleware);
router.post("/events/create", organizerController.createEvent);

//  Xem danh sách & thống kê
router.get("/dashboard", organizerController.getDashboard);

//  Cập nhật hồ sơ
router.put("/profile", organizerController.updateProfile);



//  Cập nhật sự kiện
router.put("/events/:event_id", organizerController.updateEvent);

//  Xem danh sách người tham gia
router.get("/events/:event_id/attendees", organizerController.getAttendees);

//  Export Excel
router.get("/events/:event_id/export/excel", organizerController.exportAttendeesExcel);

//  Export PDF
router.get("/events/:event_id/export/pdf", organizerController.exportAttendeesPDF);

router.post("/events/import", upload.single("file"), organizerController.importAttendees);

module.exports = router;