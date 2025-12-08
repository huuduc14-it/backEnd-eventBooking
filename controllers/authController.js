const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const JWT_SECRET = process.env.JWT_SECRET || "CHIECKHANGIOAM";

// module.exports = {
//   register: async (req, res) => {
//     try {
//       const { full_name, email, password_hash, phone } = req.body;

//       // 1. Kiểm tra input
//       if (!email || !password_hash) {
//         return res.status(400).json({
//           success: false,
//           message: "Missing email or password",
//         });
//       }

//       // 2. Hash password
//       const hashedPassword = await bcrypt.hash(password_hash, 10);

//       // 3. Lưu vào DB
//       User.createUser(
//         full_name,
//         email,
//         hashedPassword,
//         phone,
//         (err, result) => {
//           if (err) {
//             console.error("SQL ERROR:", err);
//             return res.status(500).json({
//               success: false,
//               message: "Email đã tồn tại",
//             });
//           }

//           // Lấy ID user mới tạo
//           const newUserId = result.insertId;

//           return res.json({
//             success: true,
//             message: "Đăng ký thành công",
//             user: {
//               id: newUserId,
//               full_name: full_name,
//               email: email,
//               phone: phone,
//             },
//           });
//         }
//       );
//     } catch (e) {
//       console.error("REGISTER ERROR:", e);
//       return res.status(500).json({
//         success: false,
//         message: "Server error",
//       });
//     }
//   },

//   login: (req, res) => {
//     const { email, password_hash } = req.body;

//     // 1. Validate input
//     if (!email || !password_hash) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing email or password",
//       });
//     }

//     // 2. Tìm user
//     User.findByEmail(email, async (err, results) => {
//       if (err) {
//         return res.status(500).json({
//           success: false,
//           message: "Database error",
//         });
//       }

//       if (results.length === 0) {
//         return res.status(401).json({
//           success: false,
//           message: "Email không tồn tại",
//         });
//       }

//       const user = results[0];

//       // 3. So sánh mật khẩu
//       const match = await bcrypt.compare(password_hash, user.password_hash);
//       if (!match) {
//         return res.status(401).json({
//           success: false,
//           message: "Sai mật khẩu",
//         });
//       }

//       // 4. Tạo token JWT
//       const token = jwt.sign(
//         { id: user.user_id, email: user.email },
//         process.env.JWT_SECRET,
//         { expiresIn: "7d" }
//       );

//       // 5. Response cho Android
//       return res.json({
//         success: true,
//         message: "Đăng nhập thành công",
//         user: {
//           id: user.user_id,
//           full_name: user.full_name,
//           email: user.email,
//         },
//         token: token,
//       });
//     });
//   },
// };
module.exports = {
  register: async (req, res) => {
    try {
      const { full_name, email, password_hash, phone } = req.body;

      if (!email || !password_hash) {
        return res.status(400).json({
          success: false,
          message: "Missing email or password",
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
        { user_id: user.user_id, email: user.email },
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
