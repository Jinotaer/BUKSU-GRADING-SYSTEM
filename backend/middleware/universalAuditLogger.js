import ActivityLog from '../models/activityLog.js';
import logger from '../config/logger.js';
import {
  createDetailedLogPayload,
  extractActorFromRequest,
  writeDetailedActivityLog,
} from "../utils/activityLogUtils.js";

// Universal logging middleware that works for all user types
export const universalAuditLogger = (action, category) => {
  return (req, res, next) => {
    const originalSend = res.send;
    // Store original res.json to intercept response
    const originalJson = res.json;
    const startTime = Date.now();

    const logResponse = (body) => {
      if (res.locals.__auditLogged) {
        return;
      }
      res.locals.__auditLogged = true;

      const success = res.statusCode < 400 && (!body || body.success !== false);
      const actor = extractActorFromRequest(req, body);
      const shouldLog =
        Boolean(actor.userId || actor.userEmail || actor.attemptedEmail) ||
        action === "LOGIN" ||
        action.includes("PASSWORD") ||
        !success;

      if (shouldLog) {
        const targetInfo = extractTargetInfo(req, body, actor);
        const logData = createDetailedLogPayload({
          req,
          res,
          action,
          category,
          success,
          description: generateUniversalDescription(action, req, body, success, actor),
          responseBody: body,
          errorMessage: !success ? body?.message || body?.error : null,
          targetInfo,
          startTime,
          metadata: {
            auditCategory: category,
          },
        });

        writeDetailedActivityLog(logData, {
          loggerMessage: `${(actor.userType || actor.attemptedUserType || "anonymous").toUpperCase()} ${action}`,
        }).catch((error) => {
          logger.error("Failed to log user activity", {
            action,
            error: error.message,
          });
        });
      }
    };

    res.json = function(body) {
      logResponse(body);
      // Call original json method
      return originalJson.call(this, body);
    };

    res.send = function(body) {
      let parsedBody = body;
      if (typeof body === "string") {
        try {
          parsedBody = JSON.parse(body);
        } catch {
          parsedBody = { rawBody: body };
        }
      }

      logResponse(parsedBody);
      return originalSend.call(this, body);
    };
    
    next();
  };
};

// Generate human-readable description for any user type
function generateUniversalDescription(action, req, body, success, actor) {
  const userType = actor.userType || actor.attemptedUserType || "user";
  const userEmail = actor.userEmail || actor.attemptedEmail || "anonymous";
  const baseDesc = `${userType.charAt(0).toUpperCase() + userType.slice(1)} ${userEmail}`;
  const loginMethod = req.body?.loginMethod || "default";
  const failureReason = body?.message || body?.error || "request failed";
  
  switch (action) {
    // Authentication actions
    case 'LOGIN':
      return success ? 
        `${baseDesc} successfully logged in via ${loginMethod}` : 
        `Failed login attempt for ${baseDesc} via ${loginMethod}: ${failureReason}`;
        
    case 'LOGOUT':
      return `${baseDesc} logged out`;
      
    case 'PROFILE_VIEWED':
      return `${baseDesc} viewed their profile`;
      
    case 'PROFILE_UPDATED':
      return success ? 
        `${baseDesc} updated their profile` : 
        `${baseDesc} failed to update their profile: ${failureReason}`;
    
    // Student specific actions
    case 'STUDENT_REGISTERED':
      return success ? 
        `Student ${userEmail} successfully registered` : 
        `Student registration failed for ${userEmail}`;
        
    case 'STUDENT_GRADE_VIEWED':
      return `Student ${userEmail} viewed grades`;
      
    case 'STUDENT_SCHEDULE_VIEWED':
      return `Student ${userEmail} viewed schedule`;
      
    case 'STUDENT_SUBJECT_ACCESSED':
      return `Student ${userEmail} accessed subject materials`;
      
    case 'STUDENT_ACTIVITY_SUBMITTED':
      return success ? 
        `Student ${userEmail} submitted activity` : 
        `Student ${userEmail} failed to submit activity: ${failureReason}`;
    
    // Instructor specific actions
    case 'INSTRUCTOR_SECTION_ACCESSED':
      return `Instructor ${userEmail} accessed section`;
      
    case 'INSTRUCTOR_STUDENT_GRADED':
      return success ? 
        `Instructor ${userEmail} graded student` : 
        `Instructor ${userEmail} failed to grade student: ${failureReason}`;
        
    case 'INSTRUCTOR_ACTIVITY_CREATED':
      return success ? 
        `Instructor ${userEmail} created activity` : 
        `Instructor ${userEmail} failed to create activity: ${failureReason}`;
        
    case 'INSTRUCTOR_GRADE_EXPORTED':
      return success ? 
        `Instructor ${userEmail} exported grades` : 
        `Instructor ${userEmail} failed to export grades: ${failureReason}`;
        
    case 'INSTRUCTOR_SCHEDULE_UPDATED':
      return success ? 
        `Instructor ${userEmail} updated schedule` : 
        `Instructor ${userEmail} failed to update schedule: ${failureReason}`;
        
    case 'INSTRUCTOR_CALENDAR_SYNCED':
      return success ? 
        `Instructor ${userEmail} synced calendar` : 
        `Instructor ${userEmail} failed to sync calendar: ${failureReason}`;
    
    // Admin actions (existing)
    case 'STUDENT_CREATED':
      return success ? 
        `${baseDesc} created student account` : 
        `${baseDesc} failed to create student account: ${failureReason}`;
        
    case 'STUDENT_DELETED':
      return success ? 
        `${baseDesc} deleted student account` : 
        `${baseDesc} failed to delete student account: ${failureReason}`;

    case 'STUDENT_ARCHIVED': {
      const sessionTerminated = body?.sessionTermination?.terminated === true;
      return success
        ? sessionTerminated
          ? `${baseDesc} archived a student account and terminated the student's active session`
          : `${baseDesc} archived a student account`
        : `${baseDesc} failed to archive a student account: ${failureReason}`;
    }

    case 'STUDENT_UNARCHIVED':
      return success
        ? `${baseDesc} unarchived a student account`
        : `${baseDesc} failed to unarchive a student account: ${failureReason}`;
        
    case 'INSTRUCTOR_INVITED':
      return success ? 
        `${baseDesc} invited new instructor` : 
        `${baseDesc} failed to invite instructor: ${failureReason}`;
        
    case 'SEMESTER_CREATED':
      return success ? 
        `${baseDesc} created new semester` : 
        `${baseDesc} failed to create semester: ${failureReason}`;
        
    case 'SUBJECT_CREATED':
      return success ? 
        `${baseDesc} created new subject` : 
        `${baseDesc} failed to create subject: ${failureReason}`;
        
    case 'SECTION_CREATED':
      return success ? 
        `${baseDesc} created new section` : 
        `${baseDesc} failed to create section: ${failureReason}`;
        
    default:
      return success ? 
        `${baseDesc} performed ${action.toLowerCase().replace(/_/g, ' ')}` : 
        `${baseDesc} failed to perform ${action.toLowerCase().replace(/_/g, ' ')}: ${failureReason}`;
  }
}

// Extract target information from request and response (enhanced)
function extractTargetInfo(req, body, actor) {
  if (
    (req.originalUrl.includes("/login") ||
      req.originalUrl.includes("/request-password-reset") ||
      req.originalUrl.includes("/reset-password")) &&
    (actor?.attemptedEmail || actor?.userEmail)
  ) {
    const actorType = actor?.attemptedUserType || actor?.userType;
    return {
      targetType:
        actorType === "admin"
          ? "Admin"
          : actorType === "instructor"
          ? "Instructor"
          : actorType === "student"
          ? "Student"
          : "System",
      targetIdentifier: actor?.attemptedEmail || actor?.userEmail,
    };
  }

  // Check for student operations
  if (req.params.studentId || body?.student?.id) {
    return {
      targetType: 'Student',
      targetId: req.params.studentId || body.student.id,
      targetIdentifier: body?.student?.email || body?.deletedStudent?.email || 'Unknown'
    };
  }
  
  // Check for instructor operations
  if (req.params.instructorId || body?.instructor?.id) {
    return {
      targetType: 'Instructor',
      targetId: req.params.instructorId || body.instructor.id,
      targetIdentifier: body?.instructor?.email || body?.deletedInstructor?.email || 'Unknown'
    };
  }
  
  // Check for section operations
  if (req.params.sectionId || req.originalUrl.includes('/sections/')) {
    return {
      targetType: 'Section',
      targetId: req.params.sectionId || req.params.id,
      targetIdentifier: body?.section?.name || 'Unknown'
    };
  }
  
  // Check for activity operations
  if (req.params.activityId || req.originalUrl.includes('/activities/')) {
    return {
      targetType: 'Activity',
      targetId: req.params.activityId || req.params.id,
      targetIdentifier: body?.activity?.title || 'Unknown'
    };
  }
  
  // Check for grade operations
  if (req.originalUrl.includes('/grades') || req.originalUrl.includes('/grade')) {
    return {
      targetType: 'Grade',
      targetId: req.params.gradeId || req.params.id,
      targetIdentifier: 'Grade Record'
    };
  }
  
  // Check for profile operations
  if (req.originalUrl.includes('/profile')) {
    return {
      targetType: 'Profile',
      targetId: req.params.id,
      targetIdentifier: actor?.userEmail || actor?.attemptedEmail || 'User Profile'
    };
  }
  
  // Check for schedule operations
  if (req.originalUrl.includes('/schedule')) {
    return {
      targetType: 'Schedule',
      targetId: req.params.id,
      targetIdentifier: 'Schedule'
    };
  }
  
  // Check for semester operations
  if (req.params.id && req.originalUrl.includes('/semesters/')) {
    return {
      targetType: 'Semester',
      targetId: req.params.id,
      targetIdentifier: body?.semester?.name || 'Unknown'
    };
  }
  
  // Check for subject operations
  if (req.params.id && req.originalUrl.includes('/subjects/')) {
    return {
      targetType: 'Subject',
      targetId: req.params.id,
      targetIdentifier: body?.subject?.name || 'Unknown'
    };
  }
  
  // Default to System if no specific target found
  return {
    targetType: 'System',
    targetId: null,
    targetIdentifier: 'System Operation'
  };
}

// Helper function to manually log activities from controllers
export const logUniversalActivity = async (userId, userEmail, userType, action, options = {}) => {
  try {
    const logData = {
      userId,
      userEmail,
      userType,
      // Backward compatibility
      adminId: userType === 'admin' ? userId : null,
      adminEmail: userType === 'admin' ? userEmail : null,
      
      action,
      category: options.category || 'SYSTEM',
      ipAddress: options.ipAddress || 'system',
      userAgent: options.userAgent || 'system',
      description: options.description || `${userType} action: ${action}`,
      success: options.success !== false,
      timestamp: new Date(),
      metadata: { userType, ...options.metadata || {} },
      ...options
    };
    
    return await ActivityLog.logActivity(logData);
  } catch (error) {
    logger.error('Failed to manually log universal activity:', error);
    return null;
  }
};

// Legacy exports for backward compatibility
export const auditLogger = universalAuditLogger;
export const logActivity = logUniversalActivity;

export default { universalAuditLogger, logUniversalActivity, auditLogger, logActivity };
