// controllers/authController.js
// Handles admin login and profile

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/database");

// ─────────────────────────────────────────────
//  POST /api/auth/login
//  Login with username + password
// ─────────────────────────────────────────────
const login = (req, res) => {
  const { username, email, password } = req.body;
  const loginId = username || email;

  // Validate input
  if (!loginId || !password) {
    return res.status(400).json({
      success: false,
      message: "Username/email and password are required",
    });
  }

  // Find admin in database
  const admin = db
    .prepare("SELECT * FROM admins WHERE username = ? OR email = ?")
    .get(loginId, loginId);

  if (!admin) {
    return res.status(401).json({
      success: false,
      message: "Invalid username or password",
    });
  }

  // Check if password matches the hashed password
  const isPasswordValid = bcrypt.compareSync(password, admin.password);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: "Invalid username or password",
    });
  }

  // Create JWT token (expires in 7 days)
  const token = jwt.sign(
    { id: admin.id, username: admin.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

  // Send back the token (don't send password!)
  res.json({
    success: true,
    message: "Login successful",
    token,
    admin: {
      id: admin.id,
      username: admin.username,
      email: admin.email,
    },
  });
};

// ─────────────────────────────────────────────
//  POST /api/auth/register
//  Create a new admin account
// ─────────────────────────────────────────────
const register = (req, res) => {
  const { username, email, password } = req.body;

  // Validate input
  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Username, email, and password are required",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters",
    });
  }

  // Check if username or email already exists
  const existingAdmin = db
    .prepare("SELECT id FROM admins WHERE username = ? OR email = ?")
    .get(username, email);

  if (existingAdmin) {
    return res.status(409).json({
      success: false,
      message: "Username or email already exists",
    });
  }

  // Hash the password before saving (never save plain text passwords!)
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Insert new admin
  const result = db
    .prepare("INSERT INTO admins (username, email, password) VALUES (?, ?, ?)")
    .run(username, email, hashedPassword);

  res.status(201).json({
    success: true,
    message: "Admin account created successfully",
    admin: { id: result.lastInsertRowid, username, email },
  });
};

// ─────────────────────────────────────────────
//  GET /api/auth/profile
//  Get current logged-in admin info
// ─────────────────────────────────────────────
const getProfile = (req, res) => {
  // req.admin is set by the protect middleware
  const admin = db
    .prepare("SELECT id, username, email, created_at FROM admins WHERE id = ?")
    .get(req.admin.id);

  if (!admin) {
    return res.status(404).json({ success: false, message: "Admin not found" });
  }

  res.json({ success: true, admin });
};

module.exports = { login, register, getProfile };
