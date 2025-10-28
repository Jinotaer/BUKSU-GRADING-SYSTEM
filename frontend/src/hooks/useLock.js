// frontend/src/hooks/useLock.js (rewritten)
import { useState, useEffect, useCallback, useRef } from "react";
import adminAuth, { authenticatedFetch } from "../utils/adminAuth";

const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:5000";
const LOCKS_BASE = `${API_BASE.replace(/\/$/, "")}/api/locks`;
const HEARTBEAT_INTERVAL_MS = 8 * 60 * 1000; // refresh before 10-minute lease expires

const initialStatus = { locked: false, by: null, until: null, isYou: false };

const serializeResource = (resourceType, resourceId) =>
  `${resourceType}-${resourceId}`;

const useStableTarget = (defaultType, defaultId) => {
  const defaultTypeRef = useRef(defaultType || null);
  const defaultIdRef = useRef(defaultId || null);
  const currentTypeRef = useRef(defaultType || null);
  const currentIdRef = useRef(defaultId || null);

  useEffect(() => {
    if (defaultType) {
      defaultTypeRef.current = defaultType;
      if (!currentTypeRef.current) currentTypeRef.current = defaultType;
    }
  }, [defaultType]);

  useEffect(() => {
    if (defaultId) {
      defaultIdRef.current = defaultId;
      if (!currentIdRef.current) currentIdRef.current = defaultId;
    }
  }, [defaultId]);

  const resolve = useCallback(
    (overrideType, overrideId, { preserve = false } = {}) => {
      const type =
        overrideType ?? currentTypeRef.current ?? defaultTypeRef.current;
      const id = overrideId ?? currentIdRef.current ?? defaultIdRef.current;
      if (!type || !id) return null;
      if (!preserve) {
        currentTypeRef.current = type;
        currentIdRef.current = id;
      }
      return { resourceType: type, resourceId: id };
    },
    []
  );

  return {
    defaultTypeRef,
    defaultIdRef,
    currentTypeRef,
    currentIdRef,
    resolve,
  };
};

export const useLock = (defaultType, defaultId) => {
  const [lockStatus, setLockStatus] = useState(initialStatus);
  const [acquiring, setAcquiring] = useState(false);
  const [error, setError] = useState(null);

  const { resolve, currentTypeRef, currentIdRef } = useStableTarget(
    defaultType,
    defaultId
  );

  const heartbeatRef = useRef(null);
  const lockAcquiredRef = useRef(false);
  const destroyedRef = useRef(false);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const updateLockState = useCallback((nextState) => {
    setLockStatus((prev) => ({ ...prev, ...nextState }));
  }, []);

  const startHeartbeat = useCallback(
    (force = false) => {
      if (!force && heartbeatRef.current) return;
      clearHeartbeat();
      heartbeatRef.current = setInterval(async () => {
        if (!lockAcquiredRef.current) {
          clearHeartbeat();
          return;
        }
        const target = resolve(null, null, { preserve: true });
        if (!target) return;
        try {
          const res = await authenticatedFetch(`${LOCKS_BASE}/heartbeat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(target),
          });
          if (!res.ok) {
            lockAcquiredRef.current = false;
            clearHeartbeat();
            updateLockState(initialStatus);
          }
        } catch {
          // ignore transient heartbeat failures; lease expiration will clean eventually
        }
      }, HEARTBEAT_INTERVAL_MS);
    },
    [clearHeartbeat, resolve, updateLockState]
  );

  const acquireLock = useCallback(
    async (idOverride, typeOverride) => {
      const target = resolve(typeOverride, idOverride);
      if (!target) {
        setError("Lock acquisition requires a valid resource target.");
        return false;
      }

      setAcquiring(true);
      setError(null);

      try {
        const res = await authenticatedFetch(`${LOCKS_BASE}/acquire`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(target),
        });
        const data = await res.json().catch(() => ({}));

        if (res.status === 200 || res.status === 201) {
          lockAcquiredRef.current = true;
          updateLockState({
            locked: true,
            by:
              data?.lock?.ownerName ??
              data?.ownerName ??
              data?.lock?.owner ??
              "You",
            until: data?.expiresAt ?? data?.lock?.expiresAt ?? null,
            isYou: true,
          });
          startHeartbeat(true);
          return true;
        }

        if (res.status === 423) {
          updateLockState({
            locked: true,
            by: data?.lockedBy ?? "Another admin",
            until: data?.until ?? null,
            isYou: false,
          });
          setError(
            data?.message ||
              "This resource is currently being edited by another admin."
          );
          return false;
        }

        setError(data?.message || "Failed to acquire lock.");
        return false;
      } catch (err) {
        console.error("Lock acquisition error:", err);
        setError("Network error while acquiring lock.");
        return false;
      } finally {
        setAcquiring(false);
      }
    },
    [resolve, startHeartbeat, updateLockState]
  );

  const releaseLock = useCallback(
    async (idOverride, typeOverride) => {
      const target = resolve(typeOverride, idOverride);
      if (!target) return false;

      if (!lockAcquiredRef.current) {
        updateLockState(initialStatus);
        return true;
      }

      clearHeartbeat();

      try {
        await authenticatedFetch(`${LOCKS_BASE}/release`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(target),
        });
      } catch {
        // swallow release failures (best-effort)
      }

      lockAcquiredRef.current = false;
      updateLockState(initialStatus);
      return true;
    },
    [clearHeartbeat, resolve, updateLockState]
  );

  const checkLockStatus = useCallback(
    async (idOverride, typeOverride) => {
      const target = resolve(typeOverride, idOverride, { preserve: true });
      if (!target) return;

      try {
        const res = await authenticatedFetch(
          `${LOCKS_BASE}/${target.resourceId}?resourceType=${target.resourceType}`
        );
        const data = await res.json().catch(() => ({}));

        if (data?.locked) {
          updateLockState({
            locked: true,
            by: data.by,
            until: data.until ?? null,
            isYou: !!data.isYou,
          });
        } else {
          updateLockState(initialStatus);
        }
      } catch {
        // informational only
      }
    },
    [resolve, updateLockState]
  );

  useEffect(() => {
    destroyedRef.current = false;
    return () => {
      destroyedRef.current = true;
      clearHeartbeat();
      if (lockAcquiredRef.current) {
        releaseLock().catch(() => {});
      }
    };
  }, [clearHeartbeat, releaseLock]);

  useEffect(() => {
    const handler = () => {
      if (!lockAcquiredRef.current) return;
      const target = resolve(null, null, { preserve: true });
      if (!target) return;

      const payload = JSON.stringify(target);
      let sent = false;

      if (navigator.sendBeacon) {
        try {
          const blob = new Blob([payload], { type: "application/json" });
          sent = navigator.sendBeacon(`${LOCKS_BASE}/release`, blob);
        } catch {
          sent = false;
        }
      }

      if (!sent) {
        try {
          const token = adminAuth.getAccessToken();
          if (!token) return;
          fetch(`${LOCKS_BASE}/release`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: payload,
            keepalive: true,
          }).catch(() => {});
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [resolve]);

  return {
    lockStatus,
    acquiring,
    error,
    acquireLock,
    releaseLock,
    checkLockStatus,
    isLocked: lockStatus.locked && !lockStatus.isYou,
    hasLock: lockStatus.locked && lockStatus.isYou,
  };
};

export const useBatchLockStatus = (resourceType, resourceIds = []) => {
  const [locks, setLocks] = useState({});
  const [loading, setLoading] = useState(false);

  const checkBatchStatus = useCallback(async () => {
    if (!resourceType || resourceIds.length === 0) {
      setLocks({});
      return;
    }

    setLoading(true);
    try {
      const payload = {
        resources: resourceIds.map((id) => ({
          resourceType,
          resourceId: id,
        })),
      };

      const res = await authenticatedFetch(`${LOCKS_BASE}/check-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({ locks: {} }));
      setLocks(data?.locks || {});
    } catch (err) {
      console.error("Batch lock check error:", err);
    } finally {
      setLoading(false);
    }
  }, [resourceType, JSON.stringify(resourceIds)]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    checkBatchStatus();
    const interval = setInterval(checkBatchStatus, 5_000);
    return () => clearInterval(interval);
  }, [checkBatchStatus]);

  const isLocked = useCallback(
    (id) => {
      const key = serializeResource(resourceType, id);
      const info = locks[key];
      return !!(info?.locked && !info?.isYou);
    },
    [locks, resourceType]
  );

  const getLockedBy = useCallback(
    (id) => {
      const key = serializeResource(resourceType, id);
      return locks[key]?.by || null;
    },
    [locks, resourceType]
  );

  return {
    locks,
    loading,
    isLocked,
    getLockedBy,
    refresh: checkBatchStatus,
  };
};
