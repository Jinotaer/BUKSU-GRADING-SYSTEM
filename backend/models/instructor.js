import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const instructorSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      default: null, // Optional for Google OAuth users
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
    password: {
      type: String,
      default: null, // Optional for Google OAuth users, required for email/password auth
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
    authMethod: {
      type: String,
      enum: ["google", "email"],
      default: "google",
    },
    invitedBy: {
      type: String, // admin email or ID
      required: true,
    },
    // Password reset fields
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
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

// Hash password before saving
instructorSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check password
instructorSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Delete existing model if it exists and create new one with updated schema
if (mongoose.models.Instructor) {
  delete mongoose.models.Instructor;
}

const Instructor = mongoose.model("Instructor", instructorSchema);

export default Instructor;
