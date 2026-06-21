// controllers/stockController.js
// Handles stock updates and stock history

const db = require("../config/database");

// ─────────────────────────────────────────────
//  PATCH /api/books/:id/stock
//  Update stock for a book
// ─────────────────────────────────────────────
const updateStock = (req, res) => {
  const { id } = req.params;
  const { change, reason } = req.body;

  // Validate input
  if (change === undefined || isNaN(parseInt(change))) {
    return res.status(400).json({
      success: false,
      message: "Stock change amount is required (can be positive or negative)",
    });
  }

  // Check if book exists
  const book = db.prepare("SELECT * FROM books WHERE id = ?").get(id);
  if (!book) {
    return res.status(404).json({ success: false, message: "Book not found" });
  }

  const changeAmount = parseInt(change);
  const newStock = book.stock + changeAmount;

  // Stock cannot go negative
  if (newStock < 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot remove ${Math.abs(changeAmount)} items. Current stock is only ${book.stock}.`,
    });
  }

  // Update the book's stock
  db.prepare("UPDATE books SET stock = ?, updated_at = datetime('now') WHERE id = ?").run(
    newStock,
    id
  );

  // Log this stock change for audit purposes
  db.prepare(
    "INSERT INTO stock_logs (book_id, change, reason, stock_after) VALUES (?, ?, ?, ?)"
  ).run(id, changeAmount, reason || "Stock update", newStock);

  res.json({
    success: true,
    message: `Stock updated successfully`,
    book_id: parseInt(id),
    previous_stock: book.stock,
    change: changeAmount,
    new_stock: newStock,
  });
};

// ─────────────────────────────────────────────
//  GET /api/books/:id/stock-history
//  Get the history of stock changes for a book
// ─────────────────────────────────────────────
const getStockHistory = (req, res) => {
  const { id } = req.params;

  // Check if book exists
  const book = db.prepare("SELECT id, title, stock FROM books WHERE id = ?").get(id);
  if (!book) {
    return res.status(404).json({ success: false, message: "Book not found" });
  }

  const logs = db
    .prepare(
      "SELECT * FROM stock_logs WHERE book_id = ? ORDER BY created_at DESC"
    )
    .all(id);

  res.json({
    success: true,
    book,
    stock_history: logs,
  });
};

// ─────────────────────────────────────────────
//  GET /api/stock/low
//  Get all books with low stock (stock <= 5)
// ─────────────────────────────────────────────
const getLowStockBooks = (req, res) => {
  const threshold = parseInt(req.query.threshold) || 5;

  const books = db
    .prepare(
      `SELECT b.*, c.name AS category_name
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.stock <= ?
       ORDER BY b.stock ASC`
    )
    .all(threshold);

  res.json({
    success: true,
    threshold,
    count: books.length,
    books,
  });
};

// ─────────────────────────────────────────────
//  GET /api/stock/summary
//  Get overall inventory summary
// ─────────────────────────────────────────────
const getInventorySummary = (req, res) => {
  const summary = db
    .prepare(
      `SELECT
        COUNT(*)                        AS total_books,
        SUM(stock)                      AS total_stock,
        SUM(stock * price)              AS total_inventory_value,
        COUNT(CASE WHEN stock = 0 THEN 1 END) AS out_of_stock_count,
        COUNT(CASE WHEN stock <= 5 AND stock > 0 THEN 1 END) AS low_stock_count
       FROM books`
    )
    .get();

  const topCategories = db
    .prepare(
      `SELECT c.name, COUNT(b.id) AS book_count, SUM(b.stock) AS total_stock
       FROM categories c
       LEFT JOIN books b ON c.id = b.category_id
       GROUP BY c.id
       ORDER BY book_count DESC`
    )
    .all();

  res.json({
    success: true,
    summary,
    categories: topCategories,
  });
};

module.exports = { updateStock, getStockHistory, getLowStockBooks, getInventorySummary };
