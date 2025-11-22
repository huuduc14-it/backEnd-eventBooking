const jwt = require("jsonwebtoken");
const SECRET_KEY = "CHIECKHANGIOAM";

module.exports = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(403).json({ message: "No token provided" });

  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7, authHeader.length).trim() : authHeader
  
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid token" });
    req.user = decoded;
    next();
  });
};
