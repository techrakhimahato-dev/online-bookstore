// routes/categoryRoutes.js
// URL paths for category management

const express = require("express");
const router = express.Router();
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");
const { protect } = require("../middleware/auth");

// Public - anyone can view categories
router.get("/", getAllCategories);
router.get("/:id", getCategoryById);

// Protected - only admins can create/update/delete
router.post("/", protect, createCategory);
router.put("/:id", protect, updateCategory);
router.delete("/:id", protect, deleteCategory);

module.exports = router;
