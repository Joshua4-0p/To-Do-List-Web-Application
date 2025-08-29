const express = require("express");
const authRoutes = require("./auth");
const taskRoutes = require("./tasks");

const router = express.Router();

// Mount routes
router.use("/auth", authRoutes);
router.use("/tasks", taskRoutes);

// API info endpoint
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Todo List API v1.0.0",
    version: "1.0.0",
    documentation: "/api-docs",
    endpoints: {
      authentication: "/api/auth",
      tasks: "/api/tasks",
    },
    health: "/health",
  });
});

module.exports = router;
