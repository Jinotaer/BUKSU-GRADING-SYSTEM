import express from "express";
import dns from 'dns';
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import connectDB from "./config/db.js";
import mongoose from 'mongoose';
import configurePassport from "./config/passport.js";
import passport from "passport";
import helmetConfig from "./config/helmet.js";
import logger from "./config/logger.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import instructorRoutes from "./routes/instructorRoutes.js";
import semesterRoutes from "./routes/semesterRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import sectionRoutes from "./routes/sectionRoutes.js";
import gradeRoutes from "./routes/gradeRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import seedAdminAccount from "./utils/seedAdmin.js";
import activityScoresRoutes from "./routes/activityScoresRoutes.js";
import exportRoutes from "./routes/exportRoutes.js";
import lockRouter from "./routes/lockRoutes.js"; // This file is actually a router, not a controller
import scheduleRoutes from "./routes/scheduleRoutes.js";
import googleCalendarRoutes from "./routes/googleCalendarRoutes.js";
import monitoringRoutes from "./routes/monitoringRoutes.js";
import captchaRoutes from "./routes/captchaRoutes.js";
import aiController from './controller/aiController.js';
import emailService from './services/emailService.js';


dotenv.config();

// Ensure Node's DNS resolver can resolve SRV records for Atlas. Some Windows
// setups use a local resolver that doesn't support SRV over the protocol Node
// uses. Set fallback public DNS servers so SRV lookups succeed.
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
  console.log('DNS servers set for Node resolver:', dns.getServers());
} catch (err) {
  console.warn('Failed to set DNS servers for Node resolver:', err.message || err);
}

// Connect to database and seed admin account
const initializeApp = async () => {
  try {
    await connectDB();
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      logger.database('MongoDB connected successfully');
      await seedAdminAccount();
      logger.info('Admin account seeding completed');
    } else {
      logger.warn('MongoDB not connected; skipping DB seeding and DB-dependent initialization');
    }
    
    // Initialize and verify email service
    logger.info('Initializing email service...');
    const emailVerified = await emailService.verifyConnection();
    if (emailVerified) {
      logger.info('✅ Email service ready');
    } else {
      logger.warn('⚠️ Email service not available - emails will not be sent');
    }
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    process.exit(1);
  }
};

const app = express();

// Initialize application (connect DB, seed admin, init services)
// We'll start the HTTP server only after initialization completes to avoid
// handling requests before the DB or other services are ready.
const startApp = async () => {
  await initializeApp();
};

// Apply Helmet security headers (must be early in middleware chain)
app.use(helmetConfig);

// CORS configuration
app.use(cors({
  origin: [
    "http://localhost:5001",
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));

app.use(express.json());

// Add request logging middleware for debugging
app.use((req, res, next) => {
  if (req.url.includes('/admin/login')) {
    console.log(`📝 Incoming ${req.method} request to ${req.url}`);
    console.log(`📝 Body:`, req.body);
    console.log(`📝 Headers:`, req.headers);
  }
  next();
});

// Session configuration (required for Passport)
app.use(session({
  secret: process.env.SESSION_SECRET || "your-session-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Configure Passport
configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/students", studentRoutes); 
app.use("/api/instructor", instructorRoutes);
app.use("/api/instructor", activityRoutes);
app.use("/api/instructor", activityScoresRoutes);
app.use("/api/activityScores", activityScoresRoutes);
app.use("/api/student", activityScoresRoutes);
app.use("/api/semesters", semesterRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/section", sectionRoutes);
app.use("/api/grade", gradeRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/locks", lockRouter);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/google-calendar", googleCalendarRoutes);
app.use("/api/monitoring", monitoringRoutes);
app.use("/api", captchaRoutes);
app.use('/api/ai', aiController);
// app.use("/api/instructor", instructorRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: "BUKSU Grading System API is running",
    timestamp : new Date().toISOString()
  });
});

// Generic logout endpoint (for compatibility with frontend)
app.post("/api/logout", (req, res) => {
  try {
    // If using sessions, destroy the session
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
        }
      });
    }

    // Clear any cookies
    res.clearCookie('connect.sid');
    res.clearCookie('token');

    res.status(200).json({
      success: true,
      message: "Logout successful"
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed"
    });
  }
});

// Global error handler with logging
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });
  res.status(500).json({ message: "Internal server error" });
});

// Log OAuth configuration status (not the actual secrets)
logger.info('OAuth Configuration:', {
  googleClientIdConfigured: !!process.env.GOOGLE_CLIENT_ID,
  googleClientSecretConfigured: !!process.env.GOOGLE_CLIENT_SECRET,
});

const PORT = process.env.PORT || 5000;

startApp()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔒 Security headers enabled with Helmet`);
      logger.info(`📊 Logging configured with Winston`);
    });
  })
  .catch((err) => {
    logger.error('Failed to start application:', err);
    process.exit(1);
  });
