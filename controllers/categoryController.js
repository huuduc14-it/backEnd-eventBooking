const Category = require('../models/categoryModel');

const categoryController = {
  // Lấy tất cả categories
  getAllCategories: async (req, res) => {
    try {
      const categories = await Category.getAllCategories();
      
      res.status(200).json({
        success: true,
        message: 'Categories retrieved successfully',
        data: categories
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve categories',
        error: error.message
      });
    }
  },

  // Lấy chi tiết một category
  getCategoryById: async (req, res) => {
    try {
      const { id } = req.params;
      const category = await Category.getCategoryById(id);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Category retrieved successfully',
        data: category
      });
    } catch (error) {
      console.error('Error fetching category:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve category',
        error: error.message
      });
    }
  }
};

module.exports = categoryController;
