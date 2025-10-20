
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema({   
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },                                                               
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },   
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: "Admin"
  },
  status: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active"
  },
  lastLogin: {
    type: Date,
    default: null
  },
  // Brute-force protection fields (renamed for consistency)
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  accountLockedUntil: {
    type: Date,
    default: null
  },
  lastFailedLogin: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { collection: "admins" });

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

// Method to compare password
adminSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Method to check if account is locked
adminSchema.methods.isLocked = function() {
  return !!(this.accountLockedUntil && this.accountLockedUntil > Date.now());
};

// Method to increment login attempts
adminSchema.methods.incLoginAttempts = async function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.accountLockedUntil && this.accountLockedUntil < Date.now()) {
    return this.updateOne({
      $unset: { accountLockedUntil: 1 },
      $set: { 
        failedLoginAttempts: 1,
        lastFailedLogin: new Date()
      }
    });
  }
  
  const updates = { 
    $inc: { failedLoginAttempts: 1 },
    $set: { lastFailedLogin: new Date() }
  };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.failedLoginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set.accountLockedUntil = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Method to update last login and reset attempts
adminSchema.methods.updateLastLogin = async function() {
  return this.updateOne({
    $set: { lastLogin: new Date() },
    $unset: { failedLoginAttempts: 1, accountLockedUntil: 1, lastFailedLogin: 1 }
  });
};

// Static method to create default admin
adminSchema.statics.createDefaultAdmin = async function(adminData) {
  try {
    const existingAdmin = await this.findOne({ email: adminData.email });
    
    if (existingAdmin) {
      return { success: false, message: 'Admin already exists' };
    }
    
    const admin = new this(adminData);
    await admin.save();
    
    return { success: true, admin };
  } catch (error) {
    throw error;
  }
};

// Static method to find by email
adminSchema.statics.findByEmail = async function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Check if model already exists before creating
let Admin;
try {
  Admin = mongoose.model("Admin");
} catch (error) {
  Admin = mongoose.model("Admin", adminSchema);
}

export default Admin;