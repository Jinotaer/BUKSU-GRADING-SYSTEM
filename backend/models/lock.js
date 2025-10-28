// models/lock.js
import mongoose from "mongoose";

const lockSchema = new mongoose.Schema({
  resourceType: { type: String, enum: ["semester","subject","section"], required: true },
  resourceId:   { type: mongoose.Schema.Types.ObjectId, required: true },
  ownerAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
  ownerName:    { type: String },
  acquiredAt:   { type: Date, default: Date.now },
  expiresAt:    { type: Date, required: true },
}, { collection: "locks", timestamps: true });

lockSchema.index({ resourceType: 1, resourceId: 1 }, { unique: true });
lockSchema.index({ expiresAt: 1 }); // keep queryable without auto-expiring

let Lock;
try { Lock = mongoose.model("Lock"); }
catch { Lock = mongoose.model("Lock", lockSchema); }

export default Lock;
