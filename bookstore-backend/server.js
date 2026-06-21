require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const db = require("./config/database");

const authRoutes = require("./routes/authRoutes");
const bookRoutes = require("./routes/bookRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const stockRoutes = require("./routes/stockRoutes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/stock", stockRoutes);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getOrCreateCategoryId(name) {
  const categoryName = String(name || "Uncategorized").trim() || "Uncategorized";
  const existing = db
    .prepare("SELECT id FROM categories WHERE lower(name) = lower(?)")
    .get(categoryName);

  if (existing) return existing.id;

  return db
    .prepare("INSERT INTO categories (name, description) VALUES (?, ?)")
    .run(categoryName, null).lastInsertRowid;
}

function statusFromStock(stock) {
  const quantity = Number(stock) || 0;
  if (quantity <= 0) return "out-of-stock";
  if (quantity <= 3) return "needs-ordering";
  return "available";
}

app.get("/", (req, res) => {
  const books = db
    .prepare(
      `SELECT b.*, c.name AS category_name
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.id
       ORDER BY b.created_at DESC, b.id DESC`
    )
    .all();

  const rows = books
    .map(
      (book) => `
        <tr>
          <td>${escapeHtml(book.id)}</td>
          <td>
            <strong>${escapeHtml(book.title)}</strong>
            <small>${escapeHtml(book.author)}</small>
          </td>
          <td>${escapeHtml(book.category_name || "Uncategorized")}</td>
          <td>NPR ${escapeHtml(book.price)}</td>
          <td>${escapeHtml(book.stock)}</td>
          <td>${escapeHtml(book.availability_status || statusFromStock(book.stock))}</td>
          <td>
            <form method="POST" action="/admin/books/${book.id}/delete" onsubmit="return confirm('Delete this book?')">
              <button class="danger" type="submit">Delete</button>
            </form>
          </td>
        </tr>
      `
    )
    .join("");

  res.send(`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Bookstore Backend</title>
        <style>
          body { margin: 0; font-family: Arial, sans-serif; background: #f6f4ee; color: #251c16; }
          header { background: #28483b; color: white; padding: 24px 32px; }
          main { max-width: 1180px; margin: 0 auto; padding: 28px 20px; }
          h1, h2 { margin: 0; }
          .muted { color: #6d6258; margin-top: 8px; }
          .grid { display: grid; grid-template-columns: 360px 1fr; gap: 22px; align-items: start; }
          .panel { background: white; border: 1px solid #ded6c8; border-radius: 8px; padding: 18px; box-shadow: 0 1px 2px rgba(0,0,0,.04); }
          label { display: grid; gap: 6px; margin-top: 12px; font-weight: 700; font-size: 14px; }
          input, textarea { width: 100%; box-sizing: border-box; border: 1px solid #cfc4b3; border-radius: 6px; padding: 10px 11px; font: inherit; }
          textarea { min-height: 88px; resize: vertical; }
          button { border: 0; border-radius: 6px; background: #28483b; color: white; padding: 10px 12px; font-weight: 800; cursor: pointer; }
          button.danger { background: #9b2436; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border-bottom: 1px solid #eee6da; padding: 12px; text-align: left; vertical-align: middle; }
          th { background: #f1ece2; color: #6d6258; font-size: 12px; text-transform: uppercase; }
          small { display: block; color: #6d6258; margin-top: 4px; }
          .links { display: flex; gap: 14px; margin-top: 10px; }
          .links a { color: #f1c86b; font-weight: 800; }
          @media (max-width: 850px) { .grid { grid-template-columns: 1fr; } table { font-size: 14px; } }
        </style>
      </head>
      <body>
        <header>
          <h1>Bookstore Backend</h1>
          <p class="muted" style="color:#dfe8df">SQLite database dashboard for books</p>
          <div class="links">
            <a href="/api">API Info</a>
            <a href="/api/books">Books API</a>
            <a href="/api/categories">Categories API</a>
          </div>
        </header>

        <main class="grid">
          <section class="panel">
            <h2>Add Book</h2>
            <form method="POST" action="/admin/books">
              <label>Title <input name="title" required /></label>
              <label>Author <input name="author" required /></label>
              <label>Category <input name="category" required /></label>
              <label>Price <input name="price" type="number" min="0" step="1" required /></label>
              <label>Stock <input name="stock" type="number" min="0" step="1" required /></label>
              <label>Cover Image URL <input name="image_url" /></label>
              <label>Description <textarea name="description" required></textarea></label>
              <button type="submit" style="margin-top:14px;width:100%">Add to Database</button>
            </form>
          </section>

          <section class="panel">
            <h2>Database Books (${books.length})</h2>
            <p class="muted">These records are coming directly from bookstore.db.</p>
            <div style="overflow:auto;margin-top:14px">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Book</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows || `<tr><td colspan="7">No books found. Add your first book using the form.</td></tr>`}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </body>
    </html>`);
});

app.get("/api", (req, res) => {
  res.json({
    message: "Bookstore Inventory API is running!",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      books: "/api/books",
      categories: "/api/categories",
      stock: "/api/stock",
    },
  });
});

app.post("/admin/books", (req, res, next) => {
  try {
    const { title, author, category, price, stock, image_url, description } = req.body;
    const parsedStock = Math.max(0, parseInt(stock) || 0);

    db.prepare(
      `INSERT INTO books
        (title, author, category_id, description, price, stock, availability_status, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      title,
      author,
      getOrCreateCategoryId(category),
      description || null,
      parseFloat(price) || 0,
      parsedStock,
      statusFromStock(parsedStock),
      image_url || null
    );

    res.redirect("/");
  } catch (error) {
    next(error);
  }
});

app.post("/admin/books/:id/delete", (req, res, next) => {
  try {
    db.prepare("DELETE FROM books WHERE id = ?").run(req.params.id);
    res.redirect("/");
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`,
  });
});

app.use((err, req, res, next) => {
  console.error("Error:", err.message);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ success: false, message: "File too large. Max 5MB." });
  }

  if (err.message && err.message.includes("Only JPEG")) {
    return res.status(400).json({ success: false, message: err.message });
  }

  res.status(500).json({
    success: false,
    message: "Something went wrong on the server",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("Bookstore API ready");
});
