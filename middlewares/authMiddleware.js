const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(403).json({ message: "No token provided" });
  }

  // Nếu Android gửi dạng "Bearer <token>"
  // Thì tách ra, còn nếu chỉ gửi "<token>" thì giữ nguyên
  let token = authHeader;
  if (authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    return res.status(403).json({ message: "Token missing" });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = decoded; // GÁN LẠI USER
    next();
  });
};
