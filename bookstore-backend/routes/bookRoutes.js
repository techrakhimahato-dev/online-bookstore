// routes/bookRoutes.js
// URL paths for book CRUD operations

const express = require("express");
const router = express.Router();
const {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  searchBooks,
} = require("../controllers/bookController");
const {
  updateStock,
  getStockHistory,
} = require("../controllers/stockController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

// ── Public Routes (anyone can view books) ──────────────────────────
router.get("/", getAllBooks);           // GET /api/books
router.get("/search", searchBooks);     // GET /api/books/search?q=harry
router.get("/:id", getBookById);        // GET /api/books/5

// ── Protected Routes (must be logged in to modify) ─────────────────

// upload.single("image") means accept one file with the field name "image"
router.post("/", protect, upload.single("image"), createBook);           // POST /api/books
router.put("/:id", protect, upload.single("image"), updateBook);         // PUT /api/books/5
router.delete("/:id", protect, deleteBook);                              // DELETE /api/books/5

// Stock management
router.patch("/:id/stock", protect, updateStock);        // PATCH /api/books/5/stock
router.get("/:id/stock-history", protect, getStockHistory); // GET /api/books/5/stock-history

module.exports = router;
