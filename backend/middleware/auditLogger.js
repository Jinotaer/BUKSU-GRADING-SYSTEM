import ActivityLog from '../models/activityLog.js';
import logger from '../config/logger.js';

// Middleware to automatically log admin activities
export const auditLogger = (action, category) => {
  return (req, res, next) => {
    // Store original res.json to intercept response
    const originalJson = res.json;
    const startTime = Date.now();
    
    res.json = function(body) {
      // Determine if the operation was successful
      const success = res.statusCode < 400 && (!body || body.success !== false);
      
      // Extract admin info from request
      const adminId = req.admin?.id || req.admin?.adminId;
      const adminEmail = req.admin?.email;
      
      if (adminId && adminEmail) {
        // Prepare log data
        const logData = {
          adminId,
          adminEmail,
          action,
          category,
          ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown',
          description: generateDescription(action, req, body, success),
          success,
          timestamp: new Date(),
          metadata: {
            method: req.method,
            url: req.originalUrl,
            params: req.params,
            query: req.query,
            responseTime: Date.now() - startTime,
            statusCode: res.statusCode
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
          logger.error('Failed to log admin activity:', error);
        });
        
        // Also log to Winston for immediate visibility
        const logLevel = success ? 'info' : 'warn';
        logger[logLevel](`Admin ${action}`, {
          adminEmail,
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

// Generate human-readable description based on action and request
function generateDescription(action, req, body, success) {
  const adminEmail = req.admin?.email || 'Unknown';
  const baseDesc = `Admin ${adminEmail}`;
  
  switch (action) {
    case 'LOGIN':
      return success ? 
        `${baseDesc} successfully logged in` : 
        `${baseDesc} failed to log in`;
        
    case 'LOGOUT':
      return `${baseDesc} logged out`;
      
    case 'STUDENT_CREATED':
      return success ? 
        `${baseDesc} created student account` : 
        `${baseDesc} failed to create student account`;
        
    case 'STUDENT_DELETED':
      return success ? 
        `${baseDesc} deleted student account` : 
        `${baseDesc} failed to delete student account`;
        
    case 'STUDENT_ARCHIVED':
      return success ? 
        `${baseDesc} archived student account` : 
        `${baseDesc} failed to archive student account`;
        
    case 'STUDENT_UNARCHIVED':
      return success ? 
        `${baseDesc} unarchived student account` : 
        `${baseDesc} failed to unarchive student account`;
        
    case 'INSTRUCTOR_INVITED':
      return success ? 
        `${baseDesc} invited new instructor` : 
        `${baseDesc} failed to invite instructor`;
        
    case 'INSTRUCTOR_DELETED':
      return success ? 
        `${baseDesc} deleted instructor account` : 
        `${baseDesc} failed to delete instructor account`;
        
    case 'INSTRUCTOR_ARCHIVED':
      return success ? 
        `${baseDesc} archived instructor account` : 
        `${baseDesc} failed to archive instructor account`;
        
    case 'INSTRUCTOR_UNARCHIVED':
      return success ? 
        `${baseDesc} unarchived instructor account` : 
        `${baseDesc} failed to unarchive instructor account`;
        
    case 'SEMESTER_CREATED':
      return success ? 
        `${baseDesc} created new semester` : 
        `${baseDesc} failed to create semester`;
        
    case 'SEMESTER_UPDATED':
      return success ? 
        `${baseDesc} updated semester` : 
        `${baseDesc} failed to update semester`;
        
    case 'SEMESTER_DELETED':
      return success ? 
        `${baseDesc} deleted semester` : 
        `${baseDesc} failed to delete semester`;
        
    case 'SUBJECT_CREATED':
      return success ? 
        `${baseDesc} created new subject` : 
        `${baseDesc} failed to create subject`;
        
    case 'SUBJECT_UPDATED':
      return success ? 
        `${baseDesc} updated subject` : 
        `${baseDesc} failed to update subject`;
        
    case 'SUBJECT_DELETED':
      return success ? 
        `${baseDesc} deleted subject` : 
        `${baseDesc} failed to delete subject`;
        
    case 'SECTION_CREATED':
      return success ? 
        `${baseDesc} created new section` : 
        `${baseDesc} failed to create section`;
        
    case 'SECTION_UPDATED':
      return success ? 
        `${baseDesc} updated section` : 
        `${baseDesc} failed to update section`;
        
    case 'SECTION_DELETED':
      return success ? 
        `${baseDesc} deleted section` : 
        `${baseDesc} failed to delete section`;
        
    case 'PASSWORD_RESET_REQUESTED':
      return `${baseDesc} requested password reset`;
      
    case 'PASSWORD_RESET_COMPLETED':
      return success ? 
        `${baseDesc} completed password reset` : 
        `${baseDesc} failed to complete password reset`;
        
    case 'DATA_EXPORT':
      return success ? 
        `${baseDesc} exported system data` : 
        `${baseDesc} failed to export data`;
        
    default:
      return success ? 
        `${baseDesc} performed ${action.toLowerCase().replace(/_/g, ' ')}` : 
        `${baseDesc} failed to perform ${action.toLowerCase().replace(/_/g, ' ')}`;
  }
}

// Extract target information from request and response
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
  
  // Check for section operations
  if (req.params.id && req.originalUrl.includes('/sections/')) {
    return {
      targetType: 'Section',
      targetId: req.params.id,
      targetIdentifier: body?.section?.name || 'Unknown'
    };
  }
  
  return null;
}

// Middleware for security events
export const securityLogger = (event) => {
  return (req, res, next) => {
    const logData = {
      adminId: req.admin?.id || null,
      adminEmail: req.admin?.email || 'Unknown',
      action: event,
      category: 'SECURITY',
      ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      description: `Security event: ${event}`,
      success: true,
      timestamp: new Date(),
      metadata: {
        method: req.method,
        url: req.originalUrl,
        params: req.params,
        query: req.query
      }
    };
    
    // Log security event
    ActivityLog.logActivity(logData).catch(error => {
      logger.error('Failed to log security event:', error);
    });
    
    // Also log to Winston with security level
    logger.security(`Security event: ${event}`, {
      adminEmail: logData.adminEmail,
      ip: logData.ipAddress
    });
    
    next();
  };
};

// Helper function to manually log activities from controllers
export const logActivity = async (adminId, adminEmail, action, options = {}) => {
  try {
    const logData = {
      adminId,
      adminEmail,
      action,
      category: options.category || 'SYSTEM',
      ipAddress: options.ipAddress || 'system',
      userAgent: options.userAgent || 'system',
      description: options.description || `System action: ${action}`,
      success: options.success !== false,
      timestamp: new Date(),
      metadata: options.metadata || {},
      ...options
    };
    
    return await ActivityLog.logActivity(logData);
  } catch (error) {
    logger.error('Failed to manually log activity:', error);
    return null;
  }
};

export default { auditLogger, securityLogger, logActivity };