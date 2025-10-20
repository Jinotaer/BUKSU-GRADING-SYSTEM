import mongoose from "mongoose";

const instructorSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      default: null, // Google OAuth ID
    },
    instructorid:{
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [/^[\w-\.]+@gmail\.com$/, "Invalid institutional email domain"],
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
    department: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "Instructor",
    },
    status: {
      type: String,
      enum: ["Invited", "Active"],
      default: "Active", // Automatically approved when invited by admin
    },
    invitedBy: {
      type: String, // admin email or ID
      required: true,
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
  { collection: "instructors" }
);

// Delete existing model if it exists and create new one with updated schema
if (mongoose.models.Instructor) {
  delete mongoose.models.Instructor;
}

const Instructor = mongoose.model("Instructor", instructorSchema);

export default Instructor;
