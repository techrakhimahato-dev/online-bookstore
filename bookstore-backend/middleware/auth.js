// middleware/auth.js
// This middleware protects routes - only logged-in admins can access them

const jwt = require("jsonwebtoken");

function protect(req, res, next) {
  // 1. Get token from the Authorization header
  //    The header looks like: "Bearer eyJhbGciOiJIUzI1NiIs..."
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "No token provided. Please log in first.",
    });
  }

  // 2. Extract the token (remove "Bearer " prefix)
  const token = authHeader.split(" ")[1];

  // 3. Verify the token is valid and not expired
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Attach admin info to the request so controllers can use it
    req.admin = decoded;

    // 5. Continue to the next middleware / route handler
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please log in again.",
    });
  }
}

module.exports = { protect };
