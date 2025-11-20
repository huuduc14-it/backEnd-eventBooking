const db = require("../config/db");

module.exports = {
  createUser: (email, hashedPassword, name, callback) => {
    db.query(
      "INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)",
      [email, hashedPassword, name],
      callback
    );
  },

  findByEmail: (email, callback) => {
    db.query("SELECT * FROM users WHERE email = ?", [email], callback);
  },

  getAllEvent: (callback) => {
    db.query("Select*from events order by created_at DESC", callback);
  },
};
