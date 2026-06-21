// config/database.js
// This file sets up our SQLite database and creates all tables

const { DatabaseSync } = require("node:sqlite");
const path = require("path");
const bcrypt = require("bcryptjs");

// Create/connect to the database file (bookstore.db will be created automatically)
const db = new DatabaseSync(path.join(__dirname, "../bookstore.db"));

// Enable Write-Ahead Logging for better performance
db.exec("PRAGMA journal_mode = WAL");

// ─────────────────────────────────────────────
//  CREATE TABLES
// ─────────────────────────────────────────────
function initializeDatabase() {
  // ADMINS table - stores login credentials
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      username    TEXT    NOT NULL UNIQUE,
      email       TEXT    NOT NULL UNIQUE,
      password    TEXT    NOT NULL,
      created_at  TEXT    DEFAULT (datetime('now'))
    )
  `);

  // CATEGORIES table - book categories like Fiction, Science, etc.
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL UNIQUE,
      description TEXT,
      created_at  TEXT    DEFAULT (datetime('now'))
    )
  `);

  // BOOKS table - main inventory table
  db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      title         TEXT    NOT NULL,
      author        TEXT    NOT NULL,
      isbn          TEXT    UNIQUE,
      category_id   INTEGER,
      description   TEXT,
      price         REAL    NOT NULL DEFAULT 0,
      stock         INTEGER NOT NULL DEFAULT 0,
      availability_status TEXT,
      image_url     TEXT,
      publisher     TEXT,
      published_year INTEGER,
      created_at    TEXT    DEFAULT (datetime('now')),
      updated_at    TEXT    DEFAULT (datetime('now')),

      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    )
  `);

  const bookColumns = db.prepare("PRAGMA table_info(books)").all().map((column) => column.name);
  if (!bookColumns.includes("availability_status")) {
    db.exec("ALTER TABLE books ADD COLUMN availability_status TEXT");
  }

  // STOCK_LOGS table - records every stock change (audit trail)
  db.exec(`
    CREATE TABLE IF NOT EXISTS stock_logs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id     INTEGER NOT NULL,
      change      INTEGER NOT NULL,   -- positive = added, negative = removed
      reason      TEXT,               -- e.g. "New stock", "Sale", "Damaged"
      stock_after INTEGER NOT NULL,   -- what the stock became after this change
      created_at  TEXT    DEFAULT (datetime('now')),

      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    )
  `);

  // ─────────────────────────────────────────────
  //  SEED DEFAULT DATA
  // ─────────────────────────────────────────────

  // Create default admin if none exists
  const adminExists = db
    .prepare("SELECT id FROM admins WHERE username = ?")
    .get(process.env.ADMIN_USERNAME || "admin");

  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync(
      process.env.ADMIN_PASSWORD || "admin123",
      10
    );
    db.prepare(
      "INSERT INTO admins (username, email, password) VALUES (?, ?, ?)"
    ).run(
      process.env.ADMIN_USERNAME || "admin",
      process.env.ADMIN_EMAIL || "admin@bookstore.com",
      hashedPassword
    );
    console.log("✅ Default admin created (username: admin, password: admin123)");
  }

  // Create default categories if none exist
  const categoryCount = db
    .prepare("SELECT COUNT(*) as count FROM categories")
    .get();
  if (categoryCount.count === 0) {
    const insertCategory = db.prepare(
      "INSERT INTO categories (name, description) VALUES (?, ?)"
    );
    const defaultCategories = [
      ["Fiction", "Novels, short stories, and imaginative writing"],
      ["Non-Fiction", "Factual books, biographies, and memoirs"],
      ["Science", "Physics, Chemistry, Biology and more"],
      ["Technology", "Programming, IT, and tech books"],
      ["History", "Historical events and civilizations"],
      ["Children", "Books for kids and young readers"],
      ["Self-Help", "Personal development and motivation"],
    ];
    defaultCategories.forEach(([name, desc]) =>
      insertCategory.run(name, desc)
    );
    console.log("✅ Default categories created");
  }

  console.log("✅ Database initialized successfully");
  const bookCount = db.prepare("SELECT COUNT(*) as count FROM books").get();
  if (bookCount.count === 0) {
    const getCategoryId = (name) => {
      const existing = db.prepare("SELECT id FROM categories WHERE lower(name) = lower(?)").get(name);
      if (existing) return existing.id;

      const result = db
        .prepare("INSERT INTO categories (name, description) VALUES (?, ?)")
        .run(name, null);
      return result.lastInsertRowid;
    };

    const insertBook = db.prepare(
      `INSERT INTO books
        (title, author, category_id, description, price, stock, availability_status, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const defaultBooks = [
      [
        "Karnali Blues",
        "Buddhisagar",
        "Nepali Literature",
        "A moving Nepali novel about family, memory, and growing up across western Nepal.",
        650,
        12,
        "available",
        "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=900&q=80",
      ],
      [
        "Muna Madan",
        "Laxmi Prasad Devkota",
        "Poetry",
        "A classic Nepali poetic work loved for its direct language, emotional weight, and cultural place.",
        180,
        3,
        "needs-ordering",
        "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=900&q=80",
      ],
      [
        "Atomic Habits",
        "James Clear",
        "Self Development",
        "A practical framework for building better habits through small improvements and identity based change.",
        980,
        0,
        "out-of-stock",
        "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80",
      ],
      [
        "Sapiens",
        "Yuval Noah Harari",
        "History",
        "A broad, readable look at human history, culture, cooperation, and the stories societies build around.",
        1250,
        7,
        "available",
        "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=900&q=80",
      ],
      [
        "The Psychology of Money",
        "Morgan Housel",
        "Finance",
        "Short lessons on wealth, behavior, risk, patience, and the human side of financial decisions.",
        850,
        2,
        "needs-ordering",
        "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80",
      ],
      [
        "The Alchemist",
        "Paulo Coelho",
        "Fiction",
        "A compact adventure about dreams, travel, purpose, and listening closely to the signs around you.",
        720,
        16,
        "available",
        "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&q=80",
      ],
    ];

    defaultBooks.forEach(([title, author, category, description, price, stock, status, imageUrl]) => {
      insertBook.run(title, author, getCategoryId(category), description, price, stock, status, imageUrl);
    });
    console.log("Default books created");
  }
}

// Run initialization
initializeDatabase();

// Export db so other files can use it
module.exports = db;
