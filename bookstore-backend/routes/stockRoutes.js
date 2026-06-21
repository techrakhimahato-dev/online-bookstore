// routes/stockRoutes.js
// URL paths for stock overview and reports

const express = require("express");
const router = express.Router();
const { getLowStockBooks, getInventorySummary } = require("../controllers/stockController");
const { protect } = require("../middleware/auth");

// All stock routes require login
router.get("/low", protect, getLowStockBooks);         // GET /api/stock/low
router.get("/summary", protect, getInventorySummary);  // GET /api/stock/summary

module.exports = router;
