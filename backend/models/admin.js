// models/admin.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema(
  {   
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      // Removed validation regex to allow encrypted values
    },                                                               
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },   
    password:  { type: String, required: true },

    // Optional, NOT unique
    // schoolName: { type: String, trim: true },

    role:   { type: String, default: "Admin" },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    lastLogin: { type: Date, default: null },

    // Brute-force protection fields
    failedLoginAttempts: { type: Number, default: 0 },
    accountLockedUntil:  { type: Date, default: null },
    lastFailedLogin:     { type: Date, default: null },
    createdAt:           { type: Date, default: Date.now }
  },
  { collection: "admins" }
);

// Virtual for full name
adminSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to hash password
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Account locked?
adminSchema.methods.isLocked = function() {
  return !!(this.accountLockedUntil && this.accountLockedUntil > Date.now());
};

// Increment login attempts
adminSchema.methods.incLoginAttempts = async function() {
  if (this.accountLockedUntil && this.accountLockedUntil < Date.now()) {
    return this.updateOne({
      $unset: { accountLockedUntil: 1 },
      $set: { failedLoginAttempts: 1, lastFailedLogin: new Date() }
    });
  }
  const updates = { $inc: { failedLoginAttempts: 1 }, $set: { lastFailedLogin: new Date() } };
  if (this.failedLoginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set.accountLockedUntil = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
  }
  return this.updateOne(updates);
};

// Update last login and reset attempts
adminSchema.methods.updateLastLogin = async function() {
  return this.updateOne({
    $set: { lastLogin: new Date() },
    $unset: { failedLoginAttempts: 1, accountLockedUntil: 1, lastFailedLogin: 1 }
  });
};

// Static helpers (unchanged)
adminSchema.statics.createDefaultAdmin = async function(adminData) {
  const existingAdmin = await this.findOne({ email: adminData.email.toLowerCase() });
  if (existingAdmin) return { success: false, message: 'Admin already exists' };
  const admin = new this(adminData);
  await admin.save();
  return { success: true, admin };
};

// Note: findByEmail is deprecated with encryption - use findAdminByEmail from adminController instead
// adminSchema.statics.findByEmail = function(email) {
//   return this.findOne({ email: email.toLowerCase() });
// };

// Ensure email unique index
adminSchema.index({ email: 1 }, { unique: true });

let Admin;
try { Admin = mongoose.model("Admin"); }
catch { Admin = mongoose.model("Admin", adminSchema); }

export default Admin;
