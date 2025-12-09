const db = require('../config/db');

const Category = {
  // Lấy tất cả categories
  getAllCategories: async () => {
    try {
      const [rows] = await db.execute(
        `SELECT category_id, name FROM categories ORDER BY name ASC`
      );
      return rows;
    } catch (error) {
      throw error;
    }
  },

  // Lấy chi tiết một category theo ID
  getCategoryById: async (categoryId) => {
    try {
      const [rows] = await db.execute(
        `SELECT category_id, name FROM categories WHERE category_id = ?`,
        [categoryId]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = Category;
