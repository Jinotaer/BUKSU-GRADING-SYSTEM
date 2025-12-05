import mongoose from "mongoose";

const adminResetSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose. Schema.Types.ObjectId,
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
      // ✅ Use expires instead of creating a separate index
      expires: 0, // TTL index - automatically removes expired documents
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date. now,
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
      default: 5,
    },
  },
  { 
    collection: "adminresets",
    timestamps: true
  }
);

// ❌ REMOVE duplicate index definitions if they exist below
// Only keep indexes that are NOT already defined in the schema above

let AdminReset;
try {
  AdminReset = mongoose. model("AdminReset");
} catch (error) {
  AdminReset = mongoose.model("AdminReset", adminResetSchema);
}

export default AdminReset;
