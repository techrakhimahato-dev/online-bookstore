// middleware/upload.js
// Handles image file uploads using Multer

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Make sure the uploads/books directory exists
const uploadDir = path.join(__dirname, "../uploads/books");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure where and how to save uploaded files
const storage = multer.diskStorage({
  // Set destination folder
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },

  // Set unique filename to avoid conflicts
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname); // e.g. ".jpg"
    cb(null, "book-" + uniqueSuffix + extension);
  },
});

// Only allow image files
function fileFilter(req, file, cb) {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error("Only JPEG, PNG, and WebP images are allowed!"), false);
  }
}

// Create the multer instance with size limit (5MB)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB in bytes
});

module.exports = upload;
