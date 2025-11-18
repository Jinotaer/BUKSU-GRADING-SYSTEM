import ActivityLog from '../models/activityLog.js';
import logger from '../config/logger.js';

// Universal logging middleware that works for all user types
export const universalAuditLogger = (action, category) => {
  return (req, res, next) => {
    // Store original res.json to intercept response
    const originalJson = res.json;
    const startTime = Date.now();
    
    res.json = function(body) {
      // Determine if the operation was successful
      const success = res.statusCode < 400 && (!body || body.success !== false);
      
      // Extract user info from request (works for admin, instructor, student)
      let userId, userEmail, userType;
      
      if (req.admin) {
        userId = req.admin.id || req.admin.adminId;
        userEmail = req.admin.email;
        userType = 'admin';
      } else if (req.instructor) {
        userId = req.instructor.id || req.instructor.instructorId;
        userEmail = req.instructor.email;
        userType = 'instructor';
      } else if (req.student) {
        userId = req.student.id || req.student.studentId;
        userEmail = req.student.email;
        userType = 'student';
      } else if (req.user) {
        // Generic user object
        userId = req.user.id;
        userEmail = req.user.email;
        userType = req.user.role || 'unknown';
      }
      
      if (userId && userEmail) {
        // Prepare log data
        const logData = {
          userId,
          userEmail,
          userType,
          // Backward compatibility
          adminId: userType === 'admin' ? userId : null,
          adminEmail: userType === 'admin' ? userEmail : null,
          
          action,
          category,
          ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown',
          description: generateUniversalDescription(action, req, body, success, userType, userEmail),
          success,
          timestamp: new Date(),
          metadata: {
            method: req.method,
            url: req.originalUrl,
            params: req.params,
            query: req.query,
            responseTime: Date.now() - startTime,
            statusCode: res.statusCode,
            userType
          }
        };
        
        // Add target information if available
        const targetInfo = extractTargetInfo(req, body);
        if (targetInfo) {
          logData.targetType = targetInfo.targetType;
          logData.targetId = targetInfo.targetId;
          logData.targetIdentifier = targetInfo.targetIdentifier;
        }
        
        // Add error message if operation failed
        if (!success && body?.message) {
          logData.errorMessage = body.message;
        }
        
        // Log activity asynchronously to avoid blocking the response
        ActivityLog.logActivity(logData).catch(error => {
          logger.error('Failed to log user activity:', error);
        });
        
        // Also log to Winston for immediate visibility
        const logLevel = success ? 'info' : 'warn';
        logger[logLevel](`${userType.toUpperCase()} ${action}`, {
          userEmail,
          success,
          ip: logData.ipAddress,
          responseTime: logData.metadata.responseTime
        });
      }
      
      // Call original json method
      return originalJson.call(this, body);
    };
    
    next();
  };
};

// Generate human-readable description for any user type
function generateUniversalDescription(action, req, body, success, userType, userEmail) {
  const baseDesc = `${userType.charAt(0).toUpperCase() + userType.slice(1)} ${userEmail}`;
  
  switch (action) {
    // Authentication actions
    case 'LOGIN':
      return success ? 
        `${baseDesc} successfully logged in` : 
        `${baseDesc} failed to log in`;
        
    case 'LOGOUT':
      return `${baseDesc} logged out`;
      
    case 'PROFILE_VIEWED':
      return `${baseDesc} viewed their profile`;
      
    case 'PROFILE_UPDATED':
      return success ? 
        `${baseDesc} updated their profile` : 
        `${baseDesc} failed to update their profile`;
    
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
        `Student ${userEmail} failed to submit activity`;
    
    // Instructor specific actions
    case 'INSTRUCTOR_SECTION_ACCESSED':
      return `Instructor ${userEmail} accessed section`;
      
    case 'INSTRUCTOR_STUDENT_GRADED':
      return success ? 
        `Instructor ${userEmail} graded student` : 
        `Instructor ${userEmail} failed to grade student`;
        
    case 'INSTRUCTOR_ACTIVITY_CREATED':
      return success ? 
        `Instructor ${userEmail} created activity` : 
        `Instructor ${userEmail} failed to create activity`;
        
    case 'INSTRUCTOR_GRADE_EXPORTED':
      return success ? 
        `Instructor ${userEmail} exported grades` : 
        `Instructor ${userEmail} failed to export grades`;
        
    case 'INSTRUCTOR_SCHEDULE_UPDATED':
      return success ? 
        `Instructor ${userEmail} updated schedule` : 
        `Instructor ${userEmail} failed to update schedule`;
        
    case 'INSTRUCTOR_CALENDAR_SYNCED':
      return success ? 
        `Instructor ${userEmail} synced calendar` : 
        `Instructor ${userEmail} failed to sync calendar`;
    
    // Admin actions (existing)
    case 'STUDENT_CREATED':
      return success ? 
        `${baseDesc} created student account` : 
        `${baseDesc} failed to create student account`;
        
    case 'STUDENT_DELETED':
      return success ? 
        `${baseDesc} deleted student account` : 
        `${baseDesc} failed to delete student account`;
        
    case 'INSTRUCTOR_INVITED':
      return success ? 
        `${baseDesc} invited new instructor` : 
        `${baseDesc} failed to invite instructor`;
        
    case 'SEMESTER_CREATED':
      return success ? 
        `${baseDesc} created new semester` : 
        `${baseDesc} failed to create semester`;
        
    case 'SUBJECT_CREATED':
      return success ? 
        `${baseDesc} created new subject` : 
        `${baseDesc} failed to create subject`;
        
    case 'SECTION_CREATED':
      return success ? 
        `${baseDesc} created new section` : 
        `${baseDesc} failed to create section`;
        
    default:
      return success ? 
        `${baseDesc} performed ${action.toLowerCase().replace(/_/g, ' ')}` : 
        `${baseDesc} failed to perform ${action.toLowerCase().replace(/_/g, ' ')}`;
  }
}

// Extract target information from request and response (enhanced)
function extractTargetInfo(req, body) {
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
      targetIdentifier: 'User Profile'
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