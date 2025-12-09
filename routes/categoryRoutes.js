const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// Lấy tất cả categories (public - không cần auth)
router.get('/', categoryController.getAllCategories);

// Lấy chi tiết một category
router.get('/:id', categoryController.getCategoryById);

module.exports = router;
