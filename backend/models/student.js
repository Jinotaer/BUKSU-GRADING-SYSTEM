import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const studentSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      default: null, // Optional for Google OAuth, null for email/password auth
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
    authMethod: {
      type: String,
      enum: ["google", "email"],
      default: "google",
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
  { collection: "students" }
);

// Hash password before saving
studentSchema.pre('save', async function(next) {
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
studentSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if model already exists before creating
let Student;
try {
  Student = mongoose.model("Student");
} catch (error) {
  Student = mongoose.model("Student", studentSchema);
}

export default Student;
