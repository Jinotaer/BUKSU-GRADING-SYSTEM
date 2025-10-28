// controllers/lockController.js
import mongoose from "mongoose";
import Lock from "../models/lock.js";

const LEASE_MS = Number(process.env.LOCK_LEASE_MS ?? 5 * 60 * 1000); // 5 minutes
const ALLOWED_TYPES = new Set(["semester", "subject", "section"]);

const asObjectId = (id) => new mongoose.Types.ObjectId(id);

const ensureType = (resourceType) => {
  if (!ALLOWED_TYPES.has(resourceType)) {
    const err = new Error("Invalid resourceType");
    err.status = 400;
    throw err;
  }
};

export const acquireLock = async (req, res) => {
  const { resourceType, resourceId } = req.body;
  
  if (!resourceType || !resourceId) {
    return res.status(400).json({ success: false, message: "Missing resourceType or resourceId" });
  }
  
  ensureType(resourceType);

  const ownerAdminId = req.admin._id;
  const ownerName = `${req.admin.firstName} ${req.admin.lastName}`;
  const resourceObjectId = asObjectId(resourceId);

  try {
    // Use findOneAndUpdate with upsert to atomically check and acquire lock
    const now = new Date();
    const expiresAt = new Date(Date.now() + LEASE_MS);
    
    // Try to update existing lock if owned by current admin OR if expired
    const updated = await Lock.findOneAndUpdate(
      {
        resourceType,
        resourceId: resourceObjectId,
        $or: [
          { ownerAdminId }, // Current admin already owns it
          { expiresAt: { $lte: now } } // Lock is expired
        ]
      },
      {
        $set: {
          ownerAdminId,
          ownerName,
          expiresAt
        }
      },
      { new: true }
    );

    if (updated) {
      console.log(`✅ Lock acquired/extended by ${ownerName} for ${resourceType}:${resourceId}`);
      return res.status(200).json({ success: true, lock: updated, expiresAt: updated.expiresAt });
    }

    // No existing lock found - try to create a new one
    const doc = await Lock.create({
      resourceType,
      resourceId: resourceObjectId,
      ownerAdminId,
      ownerName,
      expiresAt,
    });
    
    console.log(`✅ Lock acquired by ${ownerName} for ${resourceType}:${resourceId}`);
    console.log(`   Lock ID: ${doc._id}, Expires: ${expiresAt}`);
    
    // Verify the lock was actually saved
    const verification = await Lock.findById(doc._id);
    console.log(`   Verification: Lock exists in DB: ${!!verification}`);
    
    return res.status(201).json({ success: true, lock: doc, expiresAt: doc.expiresAt });
    
  } catch (err) {
    // Duplicate key error means someone else already has an active lock
    if (err.code === 11000) {
      const existingLock = await Lock.findOne({ 
        resourceType, 
        resourceId: resourceObjectId,
        expiresAt: { $gt: new Date() }
      });
      
      if (existingLock) {
        console.log(`❌ Lock denied for ${ownerName} - locked by ${existingLock.ownerName}`);
        return res.status(423).json({
          success: false,
          message: "Resource is locked",
          lockedBy: existingLock.ownerName,
          until: existingLock.expiresAt,
        });
      }
    }
    
    console.error('❌ Lock acquisition error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const heartbeatLock = async (req, res) => {
  const { resourceType, resourceId } = req.body;
  
  if (!resourceType || !resourceId) {
    return res.status(400).json({ success: false, message: "Missing resourceType or resourceId" });
  }
  
  ensureType(resourceType);

  const ownerAdminId = req.admin._id;
  const resourceObjectId = asObjectId(resourceId);

  const updated = await Lock.findOneAndUpdate(
    { resourceType, resourceId: resourceObjectId, ownerAdminId },
    { $set: { expiresAt: new Date(Date.now() + LEASE_MS) } },
    { new: true }
  ).lean();

  if (!updated) {
    return res.status(404).json({ success: false, message: "Lock not found or not owner" });
  }
  return res.json({ success: true, lock: updated });
};

export const releaseLock = async (req, res) => {
  const { resourceType, resourceId } = req.body;
  
  if (!resourceType || !resourceId) {
    return res.status(400).json({ success: false, message: "Missing resourceType or resourceId" });
  }
  
  ensureType(resourceType);

  const ownerAdminId = req.admin._id;
  const resourceObjectId = asObjectId(resourceId);

  // Delete lock immediately on Cancel/Save (no grace period)
  const deleted = await Lock.findOneAndDelete({
    resourceType,
    resourceId: resourceObjectId,
    ownerAdminId
  });

  if (!deleted) {
    // Lock not found or not owned by this admin - maybe already released/expired
    console.log(`⚠️ Lock not found for ${resourceType}:${resourceId} by admin ${ownerAdminId}`);
    return res.json({ success: true, message: "Lock already released or expired" });
  }

  console.log(`🔓 Lock released by ${deleted.ownerName} for ${resourceType}:${resourceId}`);
  return res.json({ success: true, message: "Lock released" });
};

export const getLockStatus = async (req, res) => {
  const { id } = req.params; // Keep this as param since it's a GET request
  const { resourceType } = req.query; // Get resourceType from query string
  
  if (!resourceType) {
    return res.status(400).json({ success: false, message: "Missing resourceType" });
  }
  
  ensureType(resourceType);

  const resourceId = asObjectId(id);
  const now = new Date();
  const lock = await Lock.findOne({ 
    resourceType, 
    resourceId,
    expiresAt: { $gt: now } // only active locks
  }).lean();

  if (!lock) {
    // Clean up expired lock if exists
    await Lock.deleteOne({ resourceType, resourceId, expiresAt: { $lte: now } }).catch(() => {});
    return res.json({ locked: false });
  }
  
  const isCurrentAdmin = String(lock.ownerAdminId) === String(req.admin._id);
  
  return res.json({ 
    locked: true, 
    by: lock.ownerName, 
    until: lock.expiresAt,
    isYou: isCurrentAdmin 
  });
};

// Batch check locks for multiple resources (for list views to disable edit/archive icons)
export const checkBatchLocks = async (req, res) => {
  const { resources } = req.body; // [{resourceType, resourceId}]
  
  if (!Array.isArray(resources)) {
    return res.status(400).json({ message: "resources must be an array" });
  }
  
  try {
    const now = new Date();
    console.log(`📋 Checking batch locks for ${resources.length} resources`);
    
    const locks = await Lock.find({
      $or: resources.map(r => ({
        resourceType: r.resourceType,
        resourceId: asObjectId(r.resourceId)
      })),
      expiresAt: { $gt: now } // only active locks
    }).lean();
    
    console.log(`📋 Found ${locks.length} active locks`);
    
    // Build a map of locks by resource
    const lockMap = {};
    
    locks.forEach(lock => {
      const key = `${lock.resourceType}-${lock.resourceId}`;
      const isCurrentAdmin = String(lock.ownerAdminId) === String(req.admin._id);
      console.log(`📋 Lock: ${key} - owned by ${lock.ownerName}, isCurrentAdmin: ${isCurrentAdmin}`);
      lockMap[key] = {
        locked: true,
        by: lock.ownerName,
        until: lock.expiresAt,
        isYou: isCurrentAdmin
      };
    });
    
    console.log(`📋 Returning lock map:`, lockMap);
    return res.json({ locks: lockMap });
  } catch (error) {
    console.error('📋 Batch lock check error:', error);
    return res.status(500).json({ message: error.message });
  }
};

// Clean up expired locks
export const cleanupExpiredLocks = async (req, res) => {
  try {
    const now = new Date();
    const result = await Lock.deleteMany({ expiresAt: { $lte: now } });
    return res.json({ 
      success: true, 
      message: `Cleaned up ${result.deletedCount} expired locks` 
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
