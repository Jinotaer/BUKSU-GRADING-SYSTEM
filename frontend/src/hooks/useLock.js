// frontend/src/hooks/useLock.js
import { useState, useEffect, useCallback, useRef } from "react";
import { authenticatedFetch } from "../utils/adminAuth";

/**
 * Hook for managing resource locks
 * Default targets can be passed, but every API also accepts (id?, type?) overrides
 * to avoid races with setState.
 */
export const useLock = (defaultType, defaultId) => {
  const [lockStatus, setLockStatus] = useState({
    locked: false,
    by: null,
    until: null,
    isYou: false,
  });
  const [acquiring, setAcquiring] = useState(false);
  const [error, setError] = useState(null);

  // The resource we *actually* operate on (survives renders)
  const currentTypeRef = useRef(defaultType || null);
  const currentIdRef   = useRef(defaultId || null);

  // Heartbeat / state refs
  const heartbeatInterval = useRef(null);
  const lockAcquired = useRef(false);
  const destroyed = useRef(false);

  const clearHeartbeat = () => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
  };

  const setTarget = (type, id) => {
    if (typeof type === "string" && type.length) {
      currentTypeRef.current = type;
    }
    if (id) {
      currentIdRef.current = id;
    }
  };

  useEffect(() => {
    if (defaultType && defaultType !== currentTypeRef.current) {
      currentTypeRef.current = defaultType;
    }
  }, [defaultType]);

  useEffect(() => {
    if (defaultId && defaultId !== currentIdRef.current) {
      currentIdRef.current = defaultId;
    }
  }, [defaultId]);

  // --- HEARTBEAT ------------------------------------------------------------
  const sendHeartbeat = useCallback(async () => {
    const resourceType = currentTypeRef.current;
    const resourceId   = currentIdRef.current;
    if (!resourceType || !resourceId || !lockAcquired.current) return;

    try {
      const res = await authenticatedFetch(`http://localhost:5000/api/locks/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceType, resourceId }),
      });
      if (!res.ok) {
        // Lost the lock: stop heartbeats and refresh status
        lockAcquired.current = false;
        clearHeartbeat();
        setError("You lost the edit lock. Your changes may not be saved.");
        // Note: checkLockStatus will be defined later, but we can call it via setState
        setLockStatus({ locked: false, by: null, until: null, isYou: false });
      }
    } catch (e) {
      // Network hiccups shouldn't explode; TTL still protects us
      // Optionally: log or surface transient error
      console.warn("Heartbeat error:", e);
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    clearHeartbeat();
    // Send every 4 minutes (lease is 5m on your server)
    heartbeatInterval.current = setInterval(sendHeartbeat, 4 * 60 * 1000);
  }, [sendHeartbeat]);

  // --- ACQUIRE --------------------------------------------------------------
  const acquireLock = useCallback(
    async (idOverride, typeOverride) => {
      const resourceType = typeOverride ?? currentTypeRef.current ?? defaultType;
      const resourceId   = idOverride   ?? currentIdRef.current   ?? defaultId;

      if (!resourceType || !resourceId) {
        setError("Lock acquisition requires a valid resource target.");
        return false;
      }

      // Remember the target we’re locking (prevents race with setState)
      setTarget(resourceType, resourceId);

      setAcquiring(true);
      setError(null);

      try {
        const res = await authenticatedFetch(`http://localhost:5000/api/locks/acquire`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resourceType, resourceId }),
        });

        const data = await res.json().catch(() => ({}));

        if (res.status === 423) {
          setError(
            data?.message ||
              `This ${resourceType} is currently being edited by ${data?.lockedBy || "another admin"}`
          );
          setLockStatus({
            locked: true,
            by: data?.lockedBy ?? "Another admin",
            until: data?.until ?? null,
            isYou: false,
          });
          return false;
        }

        if (res.ok) {
          lockAcquired.current = true;
          setLockStatus({
            locked: true,
            by: "You",
            until: data?.expiresAt ?? data?.lock?.expiresAt ?? null,
            isYou: true,
          });
          startHeartbeat();
          return true;
        }

        setError(data?.message || "Failed to acquire lock");
        return false;
      } catch {
        setError("Network error while acquiring lock");
        return false;
      } finally {
        setAcquiring(false);
      }
    },
    [defaultType, defaultId, startHeartbeat]
  );

  // --- RELEASE --------------------------------------------------------------
  const releaseLock = useCallback(
    async (idOverride, typeOverride) => {
      const resourceType = typeOverride ?? currentTypeRef.current ?? defaultType;
      const resourceId   = idOverride   ?? currentIdRef.current   ?? defaultId;

      if (!resourceType || !resourceId || !lockAcquired.current) return;

      clearHeartbeat();

      try {
        await authenticatedFetch(`http://localhost:5000/api/locks/release`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resourceType, resourceId }),
        });
      } catch {
        // ignore best-effort release failures
      }

      lockAcquired.current = false;
      setLockStatus({ locked: false, by: null, until: null, isYou: false });
    },
    [defaultType, defaultId]
  );

  // --- STATUS ---------------------------------------------------------------
  const checkLockStatus = useCallback(
    async (idOverride, typeOverride) => {
      const resourceType = typeOverride ?? currentTypeRef.current ?? defaultType;
      const resourceId   = idOverride   ?? currentIdRef.current   ?? defaultId;
      if (!resourceType || !resourceId) return;

      try {
        const res = await authenticatedFetch(
          `http://localhost:5000/api/locks/${resourceId}?resourceType=${resourceType}`
        );
        const data = await res.json();
        // Normalize payload in case server returns success:false for not-locked
        if (data?.locked) {
          setLockStatus({
            locked: true,
            by: data.by,
            until: data.until ?? null,
            isYou: !!data.isYou,
          });
        } else {
          setLockStatus({ locked: false, by: null, until: null, isYou: false });
        }
      } catch {
        // swallow; this is informational
      }
    },
    [defaultType, defaultId]
  );

  // --- LIFECYCLE CLEANUP ----------------------------------------------------
  useEffect(() => {
    destroyed.current = false;
    return () => {
      destroyed.current = true;
      clearHeartbeat();
      if (lockAcquired.current) {
        // Best-effort async release
        releaseLock().catch(() => {});
      }
    };
  }, [releaseLock]);

  // Try to release on real tab close/navigation
  useEffect(() => {
    const handler = () => {
      if (!lockAcquired.current) return;
      const resourceType = currentTypeRef.current;
      const resourceId   = currentIdRef.current;
      if (!resourceType || !resourceId) return;

      // Best effort release using sendBeacon
      try {
        const blob = new Blob(
          [JSON.stringify({ resourceType, resourceId })],
          { type: "application/json" }
        );
        navigator.sendBeacon?.("/api/locks/release", blob);
      } catch {
        // ignore
      }
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  return {
    lockStatus,
    acquiring,
    error,

    // Prefer passing explicit id/type from the caller:
    acquireLock,      // (idOverride?, typeOverride?)
    releaseLock,      // (idOverride?, typeOverride?)
    checkLockStatus,  // (idOverride?, typeOverride?)

    // Convenience flags
    isLocked: lockStatus.locked && !lockStatus.isYou,
    hasLock:  lockStatus.locked &&  lockStatus.isYou,
  };
};

/**
 * Batch checker for list views
 */
export const useBatchLockStatus = (resourceType, resourceIds = []) => {
  const [locks, setLocks] = useState({});
  const [loading, setLoading] = useState(false);

  const checkBatchStatus = useCallback(async () => {
    if (!resourceType || resourceIds.length === 0) return;
    setLoading(true);
    try {
      const payload = {
        resources: resourceIds.map((id) => ({ resourceType, resourceId: id })),
      };

      console.log(`📋 Checking batch lock status for ${resourceIds.length} ${resourceType}(s)`);
      
      const res = await authenticatedFetch(`http://localhost:5000/api/locks/check-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log(`📋 Batch lock status:`, data?.locks || {});
      setLocks(data?.locks || {});
    } catch (err) {
      console.error('📋 Batch lock check error:', err);
    } finally {
      setLoading(false);
    }
  }, [resourceType, JSON.stringify(resourceIds)]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    checkBatchStatus();
    // Check every 5 seconds instead of 60 seconds for better real-time updates
    const t = setInterval(checkBatchStatus, 5_000);
    return () => clearInterval(t);
  }, [checkBatchStatus]);

  const isLocked = useCallback(
    (id) => {
      const key = `${resourceType}-${id}`;
      const info = locks[key];
      return !!(info?.locked && !info?.isYou);
    },
    [locks, resourceType]
  );

  const getLockedBy = useCallback(
    (id) => {
      const key = `${resourceType}-${id}`;
      return locks[key]?.by || null;
    },
    [locks, resourceType]
  );

  return { locks, loading, isLocked, getLockedBy, refresh: checkBatchStatus };
};
