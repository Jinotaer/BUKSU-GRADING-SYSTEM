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
      match: [/^[\w-\.]+@student\.buksu\.edu\.ph$/, "Invalid student email domain"],
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
      enum: ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"],
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
