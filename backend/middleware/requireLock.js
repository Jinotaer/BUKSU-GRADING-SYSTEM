// middleware/requireLock.js
import mongoose from "mongoose";
import Lock from "../models/lock.js";

const toObjectId = (val) => {
  if (val instanceof mongoose.Types.ObjectId) return val;
  if (mongoose.Types.ObjectId.isValid(val)) return new mongoose.Types.ObjectId(val);
  throw new Error("INVALID_OBJECT_ID");
};

/**
 * requireLock("semester", { idParam: "id", bodyIdKeys: ["resourceId","semesterId","id"] })
 * Apply on write routes that modify a resource (update/archive/delete).
 */
export const requireLock = (resourceType, options = {}) => {
  const idParam = options.idParam ?? "id";
  const bodyIdKeys = options.bodyIdKeys ?? ["resourceId", "semesterId", "subjectId", "sectionId", "id"];

  return async (req, res, next) => {
    try {
      // 1) Auth required
      const ownerAdminId = req.admin?._id ?? req.admin?.id;
      if (!ownerAdminId) {
        return res.status(401).json({ success: false, message: "UNAUTHENTICATED" });
      }

      // 2) Resolve resourceId (from params first, then body fallbacks)
      let rawId = req.params?.[idParam];
      if (!rawId) {
        for (const k of bodyIdKeys) {
          if (req.body?.[k]) { rawId = req.body[k]; break; }
        }
      }
      if (!rawId) {
        return res.status(400).json({ success: false, message: "RESOURCE_ID_REQUIRED" });
      }

      // 3) Cast to ObjectId
      let resourceId;
      try {
        resourceId = toObjectId(rawId);
      } catch {
        return res.status(400).json({ success: false, message: "INVALID_RESOURCE_ID" });
      }

      // 4) Find ACTIVE lock (expired counts as not locked)
      const now = new Date();
      const lock = await Lock.findOne({
        resourceType,
        resourceId,
        expiresAt: { $gt: now },
      })
        .select("_id ownerAdminId ownerName expiresAt")
        .lean();

      if (!lock) {
        return res.status(423).json({
          success: false,
          code: "NOT_LOCKED",
          message: "No active lock found. Acquire a lock before modifying this resource.",
        });
      }

      // 5) Verify ownership
      if (String(lock.ownerAdminId) !== String(ownerAdminId)) {
        return res.status(423).json({
          success: false,
          code: "LOCK_HELD_BY_OTHER",
          message: `This ${resourceType} is currently being edited by ${lock.ownerName}`,
          lockedBy: lock.ownerName,
          until: lock.expiresAt,
        });
      }

      // 6) OK — pass lock along if needed
      req.lock = lock;
      req.lockResource = { resourceType, resourceId };
      return next();
    } catch (err) {
      console.error("requireLock error:", err);
      return res.status(500).json({ success: false, message: "LOCK_CHECK_FAILED" });
    }
  };
};
