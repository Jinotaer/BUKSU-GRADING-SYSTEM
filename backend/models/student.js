import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      required: true, // comes from Google OAuth or temporary for manual registration
      unique: true,
    },
    studid:{
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      // Removed regex validation since email is encrypted before saving
      // Validation is now handled in the controller before encryption
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    college: {
      type: String,
      required: true,
    },
    course: {
      type: String,
      required: true,
    },
    yearLevel: {
      type: String,
      required: true,
      // Removed enum validation since yearLevel is encrypted before saving
      // Validation is now handled in the controller before encryption
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Approved", // automatically approved
    },
    role: {
      type: String,
      default: "Student",
    },
    // Brute-force protection fields
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    accountLockedUntil: {
      type: Date,
      default: null,
    },
    lastFailedLogin: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
    archivedBy: {
      type: String, // admin email or ID
      default: null,
    },
  },
  { collection: "students" }
);

// Check if model already exists before creating
let Student;
try {
  Student = mongoose.model("Student");
} catch (error) {
  Student = mongoose.model("Student", studentSchema);
}

export default Student;
