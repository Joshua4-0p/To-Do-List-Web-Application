require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const connectDB = require("./config/database");
const { errorHandler } = require("./middleware/errorHandler");
const {
  initializeNotificationService,
} = require("./utils/notificationService");
const routes = require("./routes");

// Create Express app
const app = express();

// Connect to MongoDB
connectDB();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Todo List API",
      version: "1.0.0",
      description:
        "A comprehensive Todo List API built with Node.js, Express, and MongoDB",
      contact: {
        name: "API Support",
        email: "support@todoapp.com",
      },
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === "production"
            ? "https://your-app.render.com/api"
            : `http://localhost:${process.env.PORT || 5000}/api`,
        description:
          process.env.NODE_ENV === "production"
            ? "Production server"
            : "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./routes/*.js", "./models/*.js"],
};

const specs = swaggerJsdoc(swaggerOptions);

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
});
app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://to-do-list-web-application-o9z2.vercel.app/", // Replace with your actual frontend URL
      process.env.CLIENT_URL,
    ];

    // Allow requests with no origin (mobile apps, curl requests, etc.)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API Documentation
// app.use(
//   "/api-docs",
//   swaggerUi.serve,
//   swaggerUi.setup(specs, {
//     explorer: true,
//     customCss: ".swagger-ui .topbar { display: none }",
//     customSiteTitle: "Todo API Documentation",
//   })
// );
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs /*, swaggerUiOptions */)
);

// Optional: Serve Swagger spec as JSON
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(specs);
});

// Routes
app.use("/api", routes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
    );
    console.log(
      `📚 API Documentation available at http://localhost:${PORT}/api-docs`
    );

    // Initialize notification service
    if (process.env.NODE_ENV !== "test") {
      initializeNotificationService();
    }
  });
}

module.exports = app;
