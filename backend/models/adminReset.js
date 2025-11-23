import mongoose from "mongoose";

const adminResetSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },
    passcodeHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // MongoDB TTL index - automatically removes expired documents
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5, // Maximum attempts allowed for this reset code
    },
  },
  { 
    collection: "adminresets",
    timestamps: true
  }
);

// Index for efficient cleanup and queries
adminResetSchema.index({ adminId: 1, createdAt: -1 });
adminResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Instance method to check if reset code is expired
adminResetSchema.methods.isExpired = function() {
  return this.expiresAt < new Date();
};

// Instance method to check if reset code has exceeded max attempts
adminResetSchema.methods.hasExceededAttempts = function() {
  return this.attempts >= this.maxAttempts;
};

// Instance method to increment attempts
adminResetSchema.methods.incrementAttempts = async function() {
  this.attempts += 1;
  return this.save();
};

// Instance method to mark as used
adminResetSchema.methods.markAsUsed = async function() {
  this.isUsed = true;
  this.usedAt = new Date();
  return this.save();
};

// Static method to cleanup expired or used reset codes for an admin
adminResetSchema.statics.cleanupForAdmin = async function(adminId) {
  return this.deleteMany({
    adminId,
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isUsed: true },
    ],
  });
};

// Static method to find valid reset code for admin
adminResetSchema.statics.findValidForAdmin = async function(adminId) {
  return this.findOne({
    adminId,
    expiresAt: { $gte: new Date() },
    isUsed: false,
  }).sort({ createdAt: -1 });
};

// Pre-save middleware to ensure only one valid reset code per admin
adminResetSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Remove any existing reset codes for this admin
    await this.constructor.deleteMany({ 
      adminId: this.adminId,
      _id: { $ne: this._id }
    });
  }
  next();
});

// Virtual for time remaining
adminResetSchema.virtual('timeRemaining').get(function() {
  if (this.isExpired()) return 0;
  return Math.max(0, this.expiresAt - Date.now());
});

// Virtual for time remaining in minutes
adminResetSchema.virtual('minutesRemaining').get(function() {
  return Math.ceil(this.timeRemaining / (1000 * 60));
});

// Check if model already exists before creating
let AdminReset;
try {
  AdminReset = mongoose.model("AdminReset");
} catch (error) {
  AdminReset = mongoose.model("AdminReset", adminResetSchema);
}

export default AdminReset;