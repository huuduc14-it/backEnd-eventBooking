// routes/ticketRoutes.js
const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticketController");
const authMiddleware = require("../middlewares/authMiddleware");

// Lấy vé của user đã đăng nhập
router.get("/my-tickets", authMiddleware, ticketController.getTicketsByUser);

module.exports = router;
