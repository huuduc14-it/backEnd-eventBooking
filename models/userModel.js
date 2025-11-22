const db = require("../config/db");

module.exports = {
  createUser: (name, email, hashedPassword, callback) => {
    db.query(
      "INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)",
      [name, email, hashedPassword],
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
