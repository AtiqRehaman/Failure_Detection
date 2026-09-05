const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");

// Load environment variables before importing services that read them.
dotenv.config();

const { testConnection } = require("./config/database");
const projectRoutes = require("./routes/project.routes");
const authRoutes = require("./routes/auth.routes");
const assessmentRoutes = require("./routes/assessment.routes");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const mlService = require("./services/ml.service");

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// VALIDATE REQUIRED ENVIRONMENT VARIABLES
// ============================================================

const requiredEnvVars = ["JWT_SECRET"];
const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName],
);

if (missingEnvVars.length > 0) {
  console.error(
    `❌ Missing required environment variables: ${missingEnvVars.join(", ")}`,
  );
  if (process.env.NODE_ENV === "production") {
    console.error(
      "Please set these variables in your Render environment settings.",
    );
    process.exit(1);
  } else {
    console.warn(
      "⚠️ Running in development mode without JWT_SECRET. Authentication will fail.",
    );
  }
}

// ============================================================
// MIDDLEWARE
// ============================================================

// Security middleware
app.use(helmet());

// CORS middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

// Logging middleware
app.use(morgan("dev"));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ============================================================
// HEALTH CHECK ENDPOINT
// ============================================================

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    ml_loaded: mlService.isLoaded ? mlService.isLoaded() : false,
    jwt_configured: !!process.env.JWT_SECRET,
  });
});

// ============================================================
// API ROUTES
// ============================================================

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/assessment", assessmentRoutes);

// ============================================================
// ERROR HANDLING
// ============================================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============================================================
// START SERVER
// ============================================================

const startServer = async () => {
  try {
    // Step 1: Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.warn(
        "Database unavailable; starting without database connection.",
      );
    } else {
      console.log("Database connected.");
    }

    // Step 2: Initialize ML service (non-blocking)
    try {
      await mlService.initialize();
      if (mlService.isLoaded()) {
        console.log("ML service ready.");
      } else {
        console.warn("ML service unavailable; fallback mode enabled.");
      }
    } catch (mlError) {
      console.error("❌ ML service initialization error:", mlError.message);
    }

    // Step 3: Start the server
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}.`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received. Closing server...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received. Closing server...");
  process.exit(0);
});

// ============================================================
// UNHANDLED REJECTION HANDLER
// ============================================================

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

// ============================================================
// START THE SERVER
// ============================================================

startServer();
