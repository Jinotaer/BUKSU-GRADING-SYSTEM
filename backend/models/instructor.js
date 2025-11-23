import mongoose from "mongoose";

const instructorSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      default: null, // Google OAuth ID
    },
    googleAccessToken: {
      type: String,
      default: null, // Google Calendar access token
    },
    googleRefreshToken: {
      type: String,
      default: null, // Google Calendar refresh token
    },
    googleCalendarConnected: {
      type: Boolean,
      default: false, // Whether instructor has connected their Google Calendar
    },
    googleCalendarConnectedAt: {
      type: Date,
      default: null, // When the Google Calendar was connected
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
  { collection: "instructors" }
);

// Delete existing model if it exists and create new one with updated schema
if (mongoose.models.Instructor) {
  delete mongoose.models.Instructor;
}

const Instructor = mongoose.model("Instructor", instructorSchema);

export default Instructor;
