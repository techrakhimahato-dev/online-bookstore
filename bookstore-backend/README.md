# 📚 Bookstore Inventory Management System — Backend

A complete REST API for managing a bookstore's inventory. Built with Node.js, Express.js, and SQLite.

---

## 📁 Folder Structure

```
bookstore-backend/
│
├── server.js                  ← Entry point, starts the server
├── package.json               ← Project dependencies
├── .env                       ← Environment variables (secrets)
├── bookstore.db               ← SQLite database (auto-created on first run)
│
├── config/
│   └── database.js            ← DB setup, table creation, seed data
│
├── middleware/
│   ├── auth.js                ← JWT token verification
│   └── upload.js              ← Image upload handling (Multer)
│
├── controllers/
│   ├── authController.js      ← Login, register, profile
│   ├── bookController.js      ← Book CRUD + search
│   ├── stockController.js     ← Stock updates + history
│   └── categoryController.js  ← Category management
│
├── routes/
│   ├── authRoutes.js          ← /api/auth/*
│   ├── bookRoutes.js          ← /api/books/*
│   ├── stockRoutes.js         ← /api/stock/*
│   └── categoryRoutes.js      ← /api/categories/*
│
└── uploads/
    └── books/                 ← Uploaded book cover images
```

---

## 🗄️ Database Schema

```sql
-- Admin accounts
admins (id, username, email, password, created_at)

-- Book categories
categories (id, name, description, created_at)

-- Book inventory
books (id, title, author, isbn, category_id, description,
       price, stock, image_url, publisher, published_year,
       created_at, updated_at)

-- Stock change history (audit log)
stock_logs (id, book_id, change, reason, stock_after, created_at)
```

---

## ⚙️ Setup Instructions

### 1. Install Node.js
Download from https://nodejs.org (v18 or higher recommended)

### 2. Clone or extract the project
```bash
cd bookstore-backend
```

### 3. Install dependencies
```bash
npm install
```

### 4. Configure environment variables
Edit the `.env` file:
```
PORT=3000
JWT_SECRET=change_this_to_a_long_random_string
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### 5. Start the server
```bash
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

### 6. Test it's working
Open browser: http://localhost:3000
You should see: `📚 Bookstore Inventory API is running!`

---

## 🔑 Default Admin Login

| Field    | Value     |
|----------|-----------|
| Username | admin     |
| Password | admin123  |

**Change these in production!**

---

## 📡 API Routes Reference

### Auth Routes (`/api/auth`)

| Method | URL               | Auth? | Description          |
|--------|-------------------|-------|----------------------|
| POST   | /api/auth/login   | No    | Login, get JWT token |
| POST   | /api/auth/register| No    | Create admin account |
| GET    | /api/auth/profile | ✅ Yes | Get current admin   |

### Book Routes (`/api/books`)

| Method | URL                        | Auth? | Description              |
|--------|----------------------------|-------|--------------------------|
| GET    | /api/books                 | No    | List all books           |
| GET    | /api/books/search?q=harry  | No    | Search books             |
| GET    | /api/books/:id             | No    | Get single book          |
| POST   | /api/books                 | ✅ Yes | Add new book + image     |
| PUT    | /api/books/:id             | ✅ Yes | Update book              |
| DELETE | /api/books/:id             | ✅ Yes | Delete book              |
| PATCH  | /api/books/:id/stock       | ✅ Yes | Update stock count       |
| GET    | /api/books/:id/stock-history| ✅ Yes| View stock changes       |

**Query parameters for GET /api/books:**
- `search` — search by title, author, or ISBN
- `category` — filter by category ID
- `author` — filter by author name
- `minPrice` / `maxPrice` — price range
- `lowStock=true` — show only low stock (≤5)
- `page` / `limit` — pagination

### Category Routes (`/api/categories`)

| Method | URL                  | Auth? | Description         |
|--------|----------------------|-------|---------------------|
| GET    | /api/categories      | No    | List all categories |
| GET    | /api/categories/:id  | No    | Get category+books  |
| POST   | /api/categories      | ✅ Yes | Create category    |
| PUT    | /api/categories/:id  | ✅ Yes | Update category    |
| DELETE | /api/categories/:id  | ✅ Yes | Delete category    |

### Stock Routes (`/api/stock`)

| Method | URL                  | Auth? | Description                |
|--------|----------------------|-------|----------------------------|
| GET    | /api/stock/low       | ✅ Yes | Books with stock ≤ 5      |
| GET    | /api/stock/summary   | ✅ Yes | Inventory overview stats  |

---

## 📬 Example API Calls (using curl)

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

### Add a Book (with image)
```bash
curl -X POST http://localhost:3000/api/books \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "title=The Great Gatsby" \
  -F "author=F. Scott Fitzgerald" \
  -F "price=15.99" \
  -F "stock=50" \
  -F "category_id=1" \
  -F "image=@/path/to/cover.jpg"
```

### Search Books
```bash
curl "http://localhost:3000/api/books/search?q=gatsby"
```

### Update Stock
```bash
curl -X PATCH http://localhost:3000/api/books/1/stock \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"change": 10, "reason": "New shipment arrived"}'
```

---

## 🔐 How Authentication Works

1. Call `POST /api/auth/login` with username & password
2. You receive a JWT token
3. For protected routes, add the token to your request header:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   ```
4. The token expires after 7 days (configurable in `.env`)
