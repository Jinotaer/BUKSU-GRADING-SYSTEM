


// models/AdminReset.js
import mongoose from "mongoose";

const adminResetSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
  passcodeHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("AdminReset", adminResetSchema);
