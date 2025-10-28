// controllers/lockController.js
import mongoose from "mongoose";
import Lock from "../models/lock.js";

const LEASE_MS = Number(process.env.LOCK_LEASE_MS ?? 10 * 60 * 1000); // default 10 minutes
const ALLOWED_TYPES = new Set(["semester", "subject", "section"]);

const asObjectId = (id) => {
  if (id instanceof mongoose.Types.ObjectId) return id;
  return new mongoose.Types.ObjectId(id);
};

const ensureType = (resourceType) => {
  if (!ALLOWED_TYPES.has(resourceType)) {
    const err = new Error("Invalid resourceType");
    err.status = 400;
    throw err;
  }
};

const serializeKey = (resourceType, resourceId) =>
  `${resourceType}-${resourceId}`;

export const acquireLock = async (req, res) => {
  const { resourceType, resourceId } = req.body;

  if (!resourceType || !resourceId) {
    return res
      .status(400)
      .json({ success: false, message: "Missing resourceType or resourceId" });
  }

  ensureType(resourceType);

  const ownerAdminId = req.admin._id;
  const ownerName = `${req.admin.firstName ?? ""} ${req.admin.lastName ?? ""}`.trim();
  const resourceObjectId = asObjectId(resourceId);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + LEASE_MS);

  try {
    // Extend lock if the current admin already owns it
    let lock = await Lock.findOneAndUpdate(
      { resourceType, resourceId: resourceObjectId, ownerAdminId },
      {
        $set: {
          ownerName,
          acquiredAt: now,
          expiresAt,
        },
      },
      { new: true }
    );

    if (!lock) {
      // Try to grab an expired lock
      lock = await Lock.findOneAndUpdate(
        {
          resourceType,
          resourceId: resourceObjectId,
          expiresAt: { $lte: now },
        },
        {
          $set: {
            ownerAdminId,
            ownerName,
            acquiredAt: now,
            expiresAt,
          },
        },
        { new: true }
      );
    }

    if (lock) {
      return res
        .status(200)
        .json({ success: true, lock, expiresAt: lock.expiresAt });
    }

    // No lock exists; create a fresh one
    const doc = await Lock.create({
      resourceType,
      resourceId: resourceObjectId,
      ownerAdminId,
      ownerName,
      acquiredAt: now,
      expiresAt,
    });

    return res
      .status(201)
      .json({ success: true, lock: doc, expiresAt: doc.expiresAt });
  } catch (err) {
    if (err.code === 11000) {
      const existingLock = await Lock.findOne({
        resourceType,
        resourceId: resourceObjectId,
      }).lean();
      if (existingLock && existingLock.expiresAt > now) {
        return res.status(423).json({
          success: false,
          message: "Resource is locked",
          lockedBy: existingLock.ownerName,
          until: existingLock.expiresAt,
        });
      }
    }

    console.error("Lock acquisition error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Unable to acquire lock" });
  }
};

export const heartbeatLock = async (req, res) => {
  const { resourceType, resourceId } = req.body;

  if (!resourceType || !resourceId) {
    return res
      .status(400)
      .json({ success: false, message: "Missing resourceType or resourceId" });
  }

  ensureType(resourceType);

  const ownerAdminId = req.admin._id;
  const resourceObjectId = asObjectId(resourceId);

  const updated = await Lock.findOneAndUpdate(
    { resourceType, resourceId: resourceObjectId, ownerAdminId },
    {
      $set: {
        acquiredAt: new Date(),
        expiresAt: new Date(Date.now() + LEASE_MS),
      },
    },
    { new: true }
  ).lean();

  if (!updated) {
    return res
      .status(404)
      .json({ success: false, message: "Lock not found or not owner" });
  }

  return res.json({ success: true, lock: updated });
};

export const releaseLock = async (req, res) => {
  const { resourceType, resourceId } = req.body;

  if (!resourceType || !resourceId) {
    return res
      .status(400)
      .json({ success: false, message: "Missing resourceType or resourceId" });
  }

  ensureType(resourceType);

  const ownerAdminId = req.admin._id;
  const resourceObjectId = asObjectId(resourceId);

  const deleted = await Lock.findOneAndDelete({
    resourceType,
    resourceId: resourceObjectId,
    ownerAdminId,
  });

  if (!deleted) {
    return res.json({
      success: true,
      message: "Lock already released or expired",
    });
  }

  return res.json({ success: true, message: "Lock released" });
};

export const getLockStatus = async (req, res) => {
  const { id } = req.params;
  const { resourceType } = req.query;

  if (!resourceType) {
    return res
      .status(400)
      .json({ success: false, message: "Missing resourceType" });
  }

  ensureType(resourceType);

  const resourceId = asObjectId(id);
  const now = new Date();
  const lock = await Lock.findOne({
    resourceType,
    resourceId,
    expiresAt: { $gt: now },
  }).lean();

  if (!lock) {
    return res.json({ locked: false });
  }

  const isCurrentAdmin = String(lock.ownerAdminId) === String(req.admin._id);

  return res.json({
    locked: true,
    by: lock.ownerName,
    until: lock.expiresAt,
    isYou: isCurrentAdmin,
  });
};

export const checkBatchLocks = async (req, res) => {
  const { resources } = req.body;

  if (!Array.isArray(resources)) {
    return res.status(400).json({ message: "resources must be an array" });
  }

  try {
    const now = new Date();
    const sanitized = resources
      .map(({ resourceType, resourceId }) => {
        try {
          ensureType(resourceType);
          return {
            resourceType,
            resourceId: asObjectId(resourceId),
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    if (!sanitized.length) return res.json({ locks: {} });

    const locks = await Lock.find({
      $or: sanitized,
      expiresAt: { $gt: now },
    }).lean();

    const lockMap = {};
    for (const lock of locks) {
      const key = serializeKey(lock.resourceType, lock.resourceId);
      const isCurrentAdmin =
        String(lock.ownerAdminId) === String(req.admin._id);
      lockMap[key] = {
        locked: true,
        by: lock.ownerName,
        until: lock.expiresAt,
        isYou: isCurrentAdmin,
      };
    }

    return res.json({ locks: lockMap });
  } catch (error) {
    console.error("Batch lock check error:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const cleanupExpiredLocks = async (req, res) => {
  try {
    const now = new Date();
    const result = await Lock.deleteMany({ expiresAt: { $lte: now } });
    return res.json({
      success: true,
      message: `Cleaned up ${result.deletedCount} expired locks`,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: error.message || "Cleanup failed" });
  }
};
