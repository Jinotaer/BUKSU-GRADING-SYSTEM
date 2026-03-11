import crypto from "crypto";
import ActivityLog from "../models/activityLog.js";
import logger from "../config/logger.js";

const VALID_USER_TYPES = new Set(["admin", "instructor", "student"]);
const SENSITIVE_KEYS = new Set([
  "password",
  "newpassword",
  "currentpassword",
  "confirmpassword",
  "token",
  "accesstoken",
  "refreshtoken",
  "passcode",
  "captcharesponse",
  "googleaccesstoken",
  "googlerefreshtoken",
  "authorization",
]);

const truncateString = (value, maxLength = 120) => {
  const normalized = String(value ?? "");
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3)}...`;
};

const normalizeUserType = (value) => {
  if (!value) {
    return undefined;
  }

  const normalized = String(value).toLowerCase();
  return VALID_USER_TYPES.has(normalized) ? normalized : undefined;
};

const getHeader = (req, name) =>
  req.get?.(name) ?? req.headers?.[name.toLowerCase()] ?? null;

const summarizeValue = (value, depth = 0) => {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    return truncateString(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    if (depth > 0) {
      return `[Array(${value.length})]`;
    }

    return {
      type: "array",
      length: value.length,
      sample: value.slice(0, 3).map((item) => summarizeValue(item, depth + 1)),
    };
  }

  if (typeof value === "object") {
    if (depth > 0) {
      return {
        type: "object",
        keys: Object.keys(value).slice(0, 8),
      };
    }

    const preview = {};
    for (const [key, nestedValue] of Object.entries(value).slice(0, 8)) {
      preview[key] = summarizeValue(nestedValue, depth + 1);
    }

    return preview;
  }

  return String(value);
};

const summarizePayload = (payload) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const keys = Object.keys(payload);
  const preview = {};
  const redactedKeys = [];

  for (const key of keys.slice(0, 12)) {
    const normalizedKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(normalizedKey)) {
      preview[key] = "[REDACTED]";
      redactedKeys.push(key);
      continue;
    }

    preview[key] = summarizeValue(payload[key]);
  }

  return {
    keys,
    preview,
    redactedKeys,
    truncated: keys.length > 12,
  };
};

export const ensureRequestId = (req, res) => {
  if (!req.auditRequestId) {
    const incomingRequestId = getHeader(req, "x-request-id");
    req.auditRequestId = incomingRequestId || crypto.randomUUID();
  }

  if (res?.setHeader && !res.headersSent) {
    res.setHeader("X-Request-Id", req.auditRequestId);
  }

  return req.auditRequestId;
};

export const extractActorFromRequest = (req, responseBody = null) => {
  const actor = {
    userId: undefined,
    userEmail: undefined,
    userName: undefined,
    userType: undefined,
    attemptedEmail: undefined,
    attemptedUserType: undefined,
  };

  if (req.admin) {
    actor.userId = req.admin.id || req.admin.adminId || req.admin._id;
    actor.userEmail = req.admin.email;
    actor.userName = req.admin.fullName;
    actor.userType = "admin";
  } else if (req.instructor) {
    actor.userId =
      req.instructor.id || req.instructor.instructorId || req.instructor._id;
    actor.userEmail = req.instructor.email;
    actor.userType = "instructor";
  } else if (req.student) {
    actor.userId = req.student.id || req.student.studentId || req.student._id;
    actor.userEmail = req.student.email;
    actor.userType = "student";
  } else if (req.user) {
    if (req.user.user && req.user.role) {
      actor.userId = req.user.user._id || req.user.user.id;
      actor.userEmail = req.user.user.email;
      actor.userType = normalizeUserType(req.user.role);
    } else {
      actor.userId = req.user.id || req.user._id;
      actor.userEmail = req.user.email;
      actor.userType = normalizeUserType(
        req.user.userType || req.user.role || req.user.type
      );
    }
  }

  if (!actor.userEmail && responseBody?.admin) {
    actor.userId = responseBody.admin.id || responseBody.admin._id;
    actor.userEmail = responseBody.admin.email;
    actor.userType = "admin";
  } else if (!actor.userEmail && responseBody?.user) {
    actor.userId = responseBody.user.id || responseBody.user._id;
    actor.userEmail = responseBody.user.email;
    actor.userType = normalizeUserType(
      responseBody.user.role || responseBody.user.userType
    );
  } else if (!actor.userEmail && responseBody?.student) {
    actor.userId = responseBody.student.id || responseBody.student._id;
    actor.userEmail = responseBody.student.email;
    actor.userType = "student";
  } else if (!actor.userEmail && responseBody?.instructor) {
    actor.userId = responseBody.instructor.id || responseBody.instructor._id;
    actor.userEmail = responseBody.instructor.email;
    actor.userType = "instructor";
  }

  if (typeof req.body?.email === "string" && req.body.email.trim()) {
    actor.attemptedEmail = req.body.email.trim().toLowerCase();
  } else if (actor.userEmail) {
    actor.attemptedEmail = actor.userEmail;
  }

  actor.attemptedUserType = normalizeUserType(
    req.body?.userType ||
      req.inferredUserType ||
      actor.userType ||
      responseBody?.user?.role ||
      responseBody?.admin?.role ||
      responseBody?.student?.role ||
      responseBody?.instructor?.role
  );

  return actor;
};

export const buildRequestMetadata = (
  req,
  res,
  { responseBody = null, startTime = null, success = true, metadata = {} } = {}
) => {
  const actor = extractActorFromRequest(req, responseBody);
  const requestId = ensureRequestId(req, res);
  const forwardedForHeader = getHeader(req, "x-forwarded-for");
  const forwardedFor = forwardedForHeader
    ? forwardedForHeader
        .split(",")
        .map((ip) => ip.trim())
        .filter(Boolean)
    : [];
  const realIp = getHeader(req, "x-real-ip");
  const remoteAddress =
    req.connection?.remoteAddress || req.socket?.remoteAddress || req.ip || null;
  const clientIp = forwardedFor[0] || realIp || req.ip || remoteAddress || "unknown";

  const riskFlags = [];
  if (!success) {
    riskFlags.push("request_failed");
  }
  if (forwardedFor.length > 1) {
    riskFlags.push("multiple_forwarded_ips");
  }
  if (req.query?.token) {
    riskFlags.push("token_in_query");
  }
  if (!actor.userEmail && actor.attemptedEmail) {
    riskFlags.push("unauthenticated_actor");
  }
  if (req.originalUrl?.includes("/login")) {
    riskFlags.push("authentication_request");
  }

  return {
    requestId,
    method: req.method,
    url: req.originalUrl,
    routePath: req.route?.path || null,
    baseUrl: req.baseUrl || null,
    params: req.params || {},
    query: req.query || {},
    statusCode: res?.statusCode || null,
    responseTimeMs: startTime === null ? null : Date.now() - startTime,
    actor: {
      authenticatedUserId: actor.userId || null,
      authenticatedEmail: actor.userEmail || null,
      authenticatedName: actor.userName || null,
      authenticatedUserType: actor.userType || null,
      attemptedEmail: actor.attemptedEmail || null,
      attemptedUserType: actor.attemptedUserType || null,
    },
    network: {
      clientIp,
      forwardedFor,
      realIp: realIp || null,
      remoteAddress,
      host: getHeader(req, "host"),
      origin: getHeader(req, "origin"),
      referer: getHeader(req, "referer") || getHeader(req, "referrer"),
      protocol: req.protocol || null,
    },
    client: {
      userAgent: getHeader(req, "user-agent") || "unknown",
      acceptLanguage: getHeader(req, "accept-language"),
      secFetchSite: getHeader(req, "sec-fetch-site"),
      secFetchMode: getHeader(req, "sec-fetch-mode"),
      secFetchDest: getHeader(req, "sec-fetch-dest"),
      contentType: getHeader(req, "content-type"),
      contentLength: getHeader(req, "content-length"),
    },
    requestBody: summarizePayload(req.body),
    responseBody: summarizePayload(responseBody),
    security: {
      riskFlags,
      authHeaderPresent: Boolean(req.headers?.authorization),
      cookieAuthPresent: Boolean(req.cookies?.auth_token),
      tokenInQuery: Boolean(req.query?.token),
    },
    ...metadata,
  };
};

export const createDetailedLogPayload = ({
  req,
  res,
  action,
  category,
  success,
  description,
  responseBody = null,
  errorMessage = null,
  targetInfo = null,
  startTime = null,
  metadata = {},
  actorOverride = {},
}) => {
  const extractedActor = extractActorFromRequest(req, responseBody);
  const actor = {
    ...extractedActor,
    ...actorOverride,
  };
  const actorUserType = normalizeUserType(actor.userType || actor.attemptedUserType);
  const requestMetadata = buildRequestMetadata(req, res, {
    responseBody,
    startTime,
    success,
    metadata,
  });

  const logData = {
    userId: actor.userId || undefined,
    userEmail: actor.userEmail || actor.attemptedEmail || undefined,
    userType: actorUserType,
    adminId:
      actorUserType === "admin" && actor.userId ? actor.userId : null,
    adminEmail:
      actorUserType === "admin"
        ? actor.userEmail || actor.attemptedEmail || null
        : null,
    action,
    category,
    ipAddress: requestMetadata.network.clientIp,
    userAgent: requestMetadata.client.userAgent,
    description,
    success,
    timestamp: new Date(),
    metadata: requestMetadata,
  };

  if (targetInfo?.targetType) {
    logData.targetType = targetInfo.targetType;
  }
  if (targetInfo?.targetId) {
    logData.targetId = targetInfo.targetId;
  }
  if (targetInfo?.targetIdentifier) {
    logData.targetIdentifier = targetInfo.targetIdentifier;
  }

  const resolvedError =
    errorMessage ||
    (!success ? responseBody?.message || responseBody?.error || null : null);
  if (resolvedError) {
    logData.errorMessage = resolvedError;
  }

  return logData;
};

export const writeDetailedActivityLog = async (
  logData,
  { loggerMessage = null } = {}
) => {
  try {
    await ActivityLog.logActivity(logData);
  } catch (error) {
    logger.error("Failed to write detailed activity log", {
      action: logData.action,
      requestId: logData.metadata?.requestId,
      error: error.message,
    });
  }

  const level = logData.success ? "info" : logData.category === "SECURITY" ? "warn" : "warn";
  logger[level](
    loggerMessage ||
      `${logData.userType || "anonymous"} ${logData.action.toLowerCase()}`,
    {
      requestId: logData.metadata?.requestId,
      actor:
        logData.userEmail ||
        logData.metadata?.actor?.attemptedEmail ||
        "anonymous",
      success: logData.success,
      ip: logData.ipAddress,
      method: logData.metadata?.method,
      url: logData.metadata?.url,
      statusCode: logData.metadata?.statusCode,
      target: logData.targetIdentifier || logData.targetType || null,
      errorMessage: logData.errorMessage || null,
    }
  );
};

export const logRequestSecurityEvent = async ({
  req,
  res,
  action,
  description,
  success = false,
  category = "SECURITY",
  statusCode = null,
  responseBody = null,
  errorMessage = null,
  targetInfo = null,
  metadata = {},
  actorOverride = {},
}) => {
  if (statusCode) {
    res.statusCode = statusCode;
  }

  const logData = createDetailedLogPayload({
    req,
    res,
    action,
    category,
    success,
    description,
    responseBody,
    errorMessage,
    targetInfo,
    metadata,
    actorOverride,
  });

  await writeDetailedActivityLog(logData, {
    loggerMessage: `${action} ${success ? "succeeded" : "blocked"}`,
  });
};
