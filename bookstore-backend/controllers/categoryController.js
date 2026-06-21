// controllers/categoryController.js
// Handles book categories (create, list, update, delete)

const db = require("../config/database");

// GET /api/categories — Get all categories
const getAllCategories = (req, res) => {
  const categories = db
    .prepare(
      `SELECT c.*, COUNT(b.id) AS book_count
       FROM categories c
       LEFT JOIN books b ON c.id = b.category_id
       GROUP BY c.id
       ORDER BY c.name ASC`
    )
    .all();

  res.json({ success: true, categories });
};

// GET /api/categories/:id — Get single category + its books
const getCategoryById = (req, res) => {
  const { id } = req.params;

  const category = db.prepare("SELECT * FROM categories WHERE id = ?").get(id);
  if (!category) {
    return res.status(404).json({ success: false, message: "Category not found" });
  }

  const books = db
    .prepare("SELECT * FROM books WHERE category_id = ? ORDER BY title ASC")
    .all(id);

  res.json({ success: true, category, books });
};

// POST /api/categories — Create a new category
const createCategory = (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: "Category name is required" });
  }

  // Check for duplicate
  const existing = db.prepare("SELECT id FROM categories WHERE name = ?").get(name);
  if (existing) {
    return res.status(409).json({ success: false, message: "Category already exists" });
  }

  const result = db
    .prepare("INSERT INTO categories (name, description) VALUES (?, ?)")
    .run(name, description || null);

  const category = db.prepare("SELECT * FROM categories WHERE id = ?").get(result.lastInsertRowid);

  res.status(201).json({ success: true, message: "Category created", category });
};

// PUT /api/categories/:id — Update a category
const updateCategory = (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  const category = db.prepare("SELECT * FROM categories WHERE id = ?").get(id);
  if (!category) {
    return res.status(404).json({ success: false, message: "Category not found" });
  }

  db.prepare(
    "UPDATE categories SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?"
  ).run(name || null, description || null, id);

  const updated = db.prepare("SELECT * FROM categories WHERE id = ?").get(id);
  res.json({ success: true, message: "Category updated", category: updated });
};

// DELETE /api/categories/:id — Delete a category
const deleteCategory = (req, res) => {
  const { id } = req.params;

  const category = db.prepare("SELECT * FROM categories WHERE id = ?").get(id);
  if (!category) {
    return res.status(404).json({ success: false, message: "Category not found" });
  }

  // Books in this category will have category_id set to NULL (see schema ON DELETE SET NULL)
  db.prepare("DELETE FROM categories WHERE id = ?").run(id);

  res.json({ success: true, message: "Category deleted" });
};

module.exports = { getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory };
