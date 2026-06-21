// routes/authRoutes.js
// URL paths for authentication

const express = require("express");
const router = express.Router();
const { login, register, getProfile } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

// Public routes (no token needed)
router.post("/login", login);
router.post("/register", register);

// Protected route (must be logged in)
router.get("/profile", protect, getProfile);

module.exports = router;
