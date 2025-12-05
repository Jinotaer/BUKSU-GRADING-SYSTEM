// models/admin.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema(
  {   
    email: {
      type: String,
      required: true,
      unique: true, // ✅ Keep this - it creates the index automatically
      trim: true,
    },                                                               
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },   
    password:  { type: String, required: true },

    role:   { type: String, default: "Admin" },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    lastLogin: { type: Date, default: null },

    // Brute-force protection fields
    failedLoginAttempts: { type: Number, default: 0 },
    accountLockedUntil:  { type: Date, default: null },
  },
  { timestamps: true }
);

// Hash password before saving
adminSchema. pre("save", async function (next) {
  if (!this. isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check password
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Static method to create new admin
adminSchema.statics. createAdmin = async function(adminData) {
  const existingAdmin = await this.findOne({ email: adminData.email. toLowerCase() });
  if (existingAdmin) return { success: false, message: 'Admin already exists' };
  const admin = new this(adminData);
  await admin.save();
  return { success: true, admin };
};

// ❌ REMOVE THIS LINE - it creates a duplicate index
// adminSchema.index({ email: 1 }, { unique: true });

let Admin;
try { Admin = mongoose.model("Admin"); }
catch { Admin = mongoose.model("Admin", adminSchema); }

export default Admin;
