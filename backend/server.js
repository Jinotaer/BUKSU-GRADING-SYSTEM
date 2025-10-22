import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import connectDB from "./config/db.js";
import configurePassport from "./config/passport.js";
import passport from "passport";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import instructorRoutes from "./routes/instructorRoutes.js";
import semesterRoutes from "./routes/semesterRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import sectionRoutes from "./routes/sectionRoutes.js";
import gradeRoutes from "./routes/gradeRoutes.js";
import seedAdminAccount from "./utils/seedAdmin.js";

dotenv.config();

// Connect to database and seed admin account
const initializeApp = async () => {
  await connectDB();
  await seedAdminAccount();
};

initializeApp();

const app = express();

// CORS configuration
app.use(cors({
  origin: [
    "http://localhost:5173",
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));

app.use(express.json());

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
app.use("/api/students", studentRoutes); // Add plural route for search functionality
app.use("/api/instructor", instructorRoutes);
app.use("/api/semesters", semesterRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/section", sectionRoutes);
app.use("/api/grade", gradeRoutes);
// app.use("/api/instructor", instructorRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: "BUKSU Grading System API is running",
    timestamp : new Date().toISOString()
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
