const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const JWT_SECRET = process.env.JWT_SECRET || "CHIECKHANGIOAM";
module.exports = {
  register: async (req, res) => {
    try {
      const { full_name, email, password_hash, phone } = req.body;

      if (!email || !password_hash || !full_name || !phone) {
        return res.status(400).json({
          success: false,
          message: "Missing information",
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password_hash, 10);

      // Lưu user vào DB
      await User.createUser(full_name, email, hashedPassword, phone);

      return res.json({
        success: true,
        message: "Đăng ký thành công",
        user: {
          full_name,
          email,
          phone,
        },
      });
    } catch (err) {
      console.error("REGISTER ERROR:", err);

      // Kiểm tra duplicate email
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({
          success: false,
          message: "Email đã tồn tại",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password_hash } = req.body;

      if (!email || !password_hash) {
        return res.status(400).json({
          success: false,
          message: "Missing email or password",
        });
      }

      // Tìm user
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Email không tồn tại",
        });
      }

      // So sánh mật khẩu
      const match = await bcrypt.compare(password_hash, user.password_hash);
      if (!match) {
        return res.status(401).json({
          success: false,
          message: "Sai mật khẩu",
        });
      }

      // Tạo JWT
      const token = jwt.sign(
        { user_id: user.user_id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({
        success: true,
        message: "Đăng nhập thành công",
        user: {
          id: user.user_id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          avatar_url: user.avatar_url || null,
        },
        token,
      });
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
};
