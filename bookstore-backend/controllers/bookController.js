// controllers/bookController.js
// All book-related operations: create, read, update, delete, search

const db = require("../config/database");
const fs = require("fs");
const path = require("path");

function getOrCreateCategoryId(categoryValue) {
  const name = String(categoryValue || "").trim();
  if (!name) return null;

  const existing = db.prepare("SELECT id FROM categories WHERE lower(name) = lower(?)").get(name);
  if (existing) return existing.id;

  const result = db
    .prepare("INSERT INTO categories (name, description) VALUES (?, ?)")
    .run(name, null);
  return result.lastInsertRowid;
}

function selectBookById(id) {
  return db
    .prepare(
      `SELECT b.*, c.name AS category_name
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.id = ?`
    )
    .get(id);
}

// ─────────────────────────────────────────────
//  GET /api/books
//  Get all books (with optional search & filter)
// ─────────────────────────────────────────────
const getAllBooks = (req, res) => {
  // Query parameters for searching/filtering
  const { search, author, category, minPrice, maxPrice, lowStock, page = 1, limit = 10 } = req.query;

  // We'll build the SQL query dynamically
  let query = `
    SELECT 
      b.*,
      c.name AS category_name
    FROM books b
    LEFT JOIN categories c ON b.category_id = c.id
    WHERE 1=1
  `;

  const params = [];

  // Add search filter (searches title AND author)
  if (search) {
    query += " AND (b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  // Filter by author name
  if (author) {
    query += " AND b.author LIKE ?";
    params.push(`%${author}%`);
  }

  // Filter by category ID
  if (category) {
    query += " AND b.category_id = ?";
    params.push(category);
  }

  // Filter by price range
  if (minPrice) {
    query += " AND b.price >= ?";
    params.push(parseFloat(minPrice));
  }
  if (maxPrice) {
    query += " AND b.price <= ?";
    params.push(parseFloat(maxPrice));
  }

  // Show only low stock books (stock <= 5)
  if (lowStock === "true") {
    query += " AND b.stock <= 5";
  }

  // Count total results (for pagination info)
  const countQuery = `SELECT COUNT(*) as total FROM (${query})`;
  const { total } = db.prepare(countQuery).get(...params);

  // Add pagination
  const offset = (parseInt(page) - 1) * parseInt(limit);
  query += " ORDER BY b.created_at DESC LIMIT ? OFFSET ?";
  params.push(parseInt(limit), offset);

  const books = db.prepare(query).all(...params);

  res.json({
    success: true,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit)),
    books,
  });
};

// ─────────────────────────────────────────────
//  GET /api/books/:id
//  Get a single book by ID
// ─────────────────────────────────────────────
const getBookById = (req, res) => {
  const { id } = req.params;

  const book = db
    .prepare(
      `SELECT b.*, c.name AS category_name
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.id = ?`
    )
    .get(id);

  if (!book) {
    return res
      .status(404)
      .json({ success: false, message: "Book not found" });
  }

  res.json({ success: true, book });
};

// ─────────────────────────────────────────────
//  POST /api/books
//  Add a new book
// ─────────────────────────────────────────────
const createBook = (req, res) => {
  const {
    title,
    author,
    isbn,
    category_id,
    category,
    category_name,
    description,
    price,
    stock,
    stockQuantity,
    availability_status,
    availabilityStatus,
    image_url: bodyImageUrl,
    coverImage,
    publisher,
    published_year,
  } = req.body;

  // Required fields validation
  if (!title || !author || price === undefined) {
    // If a file was uploaded but validation fails, delete it
    if (req.file) fs.unlinkSync(req.file.path);

    return res.status(400).json({
      success: false,
      message: "Title, author, and price are required",
    });
  }

  // If an image was uploaded, build the URL
  const image_url = req.file
    ? `/uploads/books/${req.file.filename}`
    : bodyImageUrl || coverImage || null;
  const resolvedCategoryId = category_id || getOrCreateCategoryId(category || category_name);
  const resolvedStock = stock ?? stockQuantity ?? 0;
  const resolvedStatus = availability_status || availabilityStatus || null;

  // Insert into database
  const result = db
    .prepare(
      `INSERT INTO books 
        (title, author, isbn, category_id, description, price, stock, availability_status, image_url, publisher, published_year)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      title,
      author,
      isbn || null,
      resolvedCategoryId,
      description || null,
      parseFloat(price),
      parseInt(resolvedStock) || 0,
      resolvedStatus,
      image_url,
      publisher || null,
      published_year ? parseInt(published_year) : null
    );

  // Log the initial stock
  if (parseInt(resolvedStock) > 0) {
    db.prepare(
      "INSERT INTO stock_logs (book_id, change, reason, stock_after) VALUES (?, ?, ?, ?)"
    ).run(result.lastInsertRowid, parseInt(resolvedStock), "Initial stock", parseInt(resolvedStock));
  }

  // Return the newly created book
  const newBook = selectBookById(result.lastInsertRowid);

  res.status(201).json({
    success: true,
    message: "Book added successfully",
    book: newBook,
  });
};

// ─────────────────────────────────────────────
//  PUT /api/books/:id
//  Update an existing book
// ─────────────────────────────────────────────
const updateBook = (req, res) => {
  const { id } = req.params;
  const {
    title,
    author,
    isbn,
    category_id,
    category,
    category_name,
    description,
    price,
    stock,
    stockQuantity,
    availability_status,
    availabilityStatus,
    image_url: bodyImageUrl,
    coverImage,
    publisher,
    published_year,
  } = req.body;

  // Check if book exists
  const existingBook = db.prepare("SELECT * FROM books WHERE id = ?").get(id);
  if (!existingBook) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(404).json({ success: false, message: "Book not found" });
  }

  // If a new image was uploaded, delete the old one
  let image_url = existingBook.image_url;
  if (req.file) {
    if (existingBook.image_url) {
      const oldImagePath = path.join(__dirname, "..", existingBook.image_url);
      if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
    }
    image_url = `/uploads/books/${req.file.filename}`;
  } else if (bodyImageUrl !== undefined || coverImage !== undefined) {
    image_url = bodyImageUrl || coverImage || null;
  }

  const resolvedCategoryId =
    category_id !== undefined ? category_id : getOrCreateCategoryId(category || category_name);
  const resolvedStock = stock ?? stockQuantity;
  const shouldUpdateStock = resolvedStock !== undefined;
  const nextStock = Math.max(0, parseInt(resolvedStock) || 0);
  const resolvedStatus = availability_status || availabilityStatus;

  // Update the book
  db.prepare(
    `UPDATE books SET
      title         = COALESCE(?, title),
      author        = COALESCE(?, author),
      isbn          = COALESCE(?, isbn),
      category_id   = COALESCE(?, category_id),
      description   = COALESCE(?, description),
      price         = COALESCE(?, price),
      stock         = CASE WHEN ? THEN ? ELSE stock END,
      availability_status = COALESCE(?, availability_status),
      image_url     = ?,
      publisher     = COALESCE(?, publisher),
      published_year = COALESCE(?, published_year),
      updated_at    = datetime('now')
    WHERE id = ?`
  ).run(
    title || null,
    author || null,
    isbn || null,
    resolvedCategoryId || null,
    description || null,
    price ? parseFloat(price) : null,
    shouldUpdateStock ? 1 : 0,
    nextStock,
    resolvedStatus || null,
    image_url,
    publisher || null,
    published_year ? parseInt(published_year) : null,
    id
  );

  if (shouldUpdateStock && nextStock !== existingBook.stock) {
    db.prepare(
      "INSERT INTO stock_logs (book_id, change, reason, stock_after) VALUES (?, ?, ?, ?)"
    ).run(id, nextStock - existingBook.stock, "Stock update", nextStock);
  }

  const updatedBook = selectBookById(id);

  res.json({
    success: true,
    message: "Book updated successfully",
    book: updatedBook,
  });
};

// ─────────────────────────────────────────────
//  DELETE /api/books/:id
//  Delete a book
// ─────────────────────────────────────────────
const deleteBook = (req, res) => {
  const { id } = req.params;

  const book = db.prepare("SELECT * FROM books WHERE id = ?").get(id);
  if (!book) {
    return res.status(404).json({ success: false, message: "Book not found" });
  }

  // Delete image file from disk if it exists
  if (book.image_url) {
    const imagePath = path.join(__dirname, "..", book.image_url);
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
  }

  // Delete from database (stock_logs will be deleted by CASCADE)
  db.prepare("DELETE FROM books WHERE id = ?").run(id);

  res.json({ success: true, message: "Book deleted successfully" });
};

// ─────────────────────────────────────────────
//  GET /api/books/search
//  Search books by title, author, or category
// ─────────────────────────────────────────────
const searchBooks = (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res
      .status(400)
      .json({ success: false, message: "Search query (q) is required" });
  }

  const books = db
    .prepare(
      `SELECT b.*, c.name AS category_name
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.title LIKE ? OR b.author LIKE ? OR c.name LIKE ? OR b.isbn LIKE ?
       ORDER BY b.title ASC
       LIMIT 20`
    )
    .all(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);

  res.json({ success: true, count: books.length, books });
};

module.exports = { getAllBooks, getBookById, createBook, updateBook, deleteBook, searchBooks };
