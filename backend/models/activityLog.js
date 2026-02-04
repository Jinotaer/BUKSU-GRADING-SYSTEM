import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  // Who performed the action (new universal fields)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false // Made optional for backward compatibility
  },
  userEmail: {
    type: String,
    required: false // Made optional for backward compatibility
  },
  userType: {
    type: String,
    required: false, // Made optional for backward compatibility
    enum: ['admin', 'instructor', 'student']
  },
  // Legacy fields for backward compatibility
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  adminEmail: {
    type: String
  },
  
  // Action details
  action: {
    type: String,
    required: true,
    enum: [
      // Authentication actions
      'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_RESET_REQUESTED', 
      'PASSWORD_RESET_COMPLETED', 'PASSWORD_CHANGED', 'PASSWORD_CHANGE_FAILED',
      'TOKEN_REFRESH', 'PROFILE_VIEWED', 'PROFILE_UPDATED',
      
      // User management actions (Admin)
      'STUDENT_CREATED', 'STUDENT_UPDATED', 'STUDENT_DELETED', 'STUDENT_ARCHIVED', 'STUDENT_UNARCHIVED',
      'STUDENT_VIEWED', 'STUDENT_ENROLLED', 'STUDENT_REMOVED', 'STUDENTS_INVITED',
      'INSTRUCTOR_INVITED', 'INSTRUCTOR_CREATED', 'INSTRUCTOR_UPDATED', 'INSTRUCTOR_DELETED', 
      'INSTRUCTOR_ARCHIVED', 'INSTRUCTOR_UNARCHIVED', 'INSTRUCTOR_VIEWED', 'INSTRUCTOR_ASSIGNED',
      
      // Student actions
      'STUDENT_REGISTERED', 'STUDENT_GRADE_VIEWED', 'STUDENT_SCHEDULE_VIEWED',
      'STUDENT_SUBJECT_ACCESSED', 'STUDENT_ACTIVITY_SUBMITTED', 'STUDENT_PROFILE_UPDATED',
      
      // Instructor actions
      'INSTRUCTOR_SECTION_ACCESSED', 'INSTRUCTOR_STUDENT_GRADED', 'INSTRUCTOR_ACTIVITY_CREATED',
      'INSTRUCTOR_GRADE_EXPORTED', 'INSTRUCTOR_FINAL_GRADE_EXPORTED', 'INSTRUCTOR_SCHEDULE_UPDATED', 'INSTRUCTOR_CALENDAR_SYNCED',
      'INSTRUCTOR_SUBJECT_ACCESSED',
      
      // Academic management actions
      'SEMESTER_CREATED', 'SEMESTER_UPDATED', 'SEMESTER_DELETED', 'SEMESTER_ARCHIVED', 'SEMESTER_UNARCHIVED',
      'SEMESTER_VIEWED',
      'SUBJECT_CREATED', 'SUBJECT_UPDATED', 'SUBJECT_DELETED', 'SUBJECT_ARCHIVED', 'SUBJECT_UNARCHIVED',
      'SUBJECT_VIEWED',
      'SECTION_CREATED', 'SECTION_UPDATED', 'SECTION_DELETED', 'SECTION_ARCHIVED', 'SECTION_UNARCHIVED',
      'SECTION_VIEWED', 'SECTION_STUDENTS_VIEWED',
      
      // Grade and activity management
      'GRADE_CREATED', 'GRADE_UPDATED', 'GRADE_DELETED', 'GRADE_VIEWED', 'GRADES_RECALCULATED',
      'GRADING_SCHEMA_UPDATED',
      'ACTIVITY_CREATED', 'ACTIVITY_UPDATED', 'ACTIVITY_DELETED', 'ACTIVITY_VIEWED', 'ACTIVITY_TOGGLED',
      'ACTIVITY_SCORES_VIEWED', 'ACTIVITY_SCORES_UPDATED',
      
      // Schedule management
      'SCHEDULE_VIEWED', 'SCHEDULE_UPDATED', 'SCHEDULE_DELETED',
      'INSTRUCTOR_SCHEDULE_VIEWED', 'STUDENT_SCHEDULE_VIEWED',
      
      // Calendar management
      'CALENDAR_AUTH_REQUESTED', 'CALENDAR_STATUS_CHECKED', 'CALENDAR_DISCONNECTED',
      
      // System actions
      'SYSTEM_BACKUP_CREATED', 'SYSTEM_SETTINGS_UPDATED', 'SYSTEM_MAINTENANCE',
      'DATA_EXPORT', 'DATA_IMPORT', 'DASHBOARD_VIEWED',
      
      // Security events
      'SUSPICIOUS_ACTIVITY', 'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED', 
      'UNAUTHORIZED_ACCESS_ATTEMPT', 'SECURITY_VIOLATION'
    ]
  },
  
  // Event categorization
  category: {
    type: String,
    required: true,
    enum: [
      'AUTHENTICATION', 'USER_MANAGEMENT', 'ACADEMIC_MANAGEMENT', 'GRADE_MANAGEMENT', 
      'SYSTEM', 'SECURITY', 'STUDENT_ACTIVITY', 'INSTRUCTOR_ACTIVITY', 'PROFILE_MANAGEMENT'
    ]
  },
  
  // What was affected
  targetType: {
    type: String,
    enum: [
      'Student', 'Instructor', 'Admin', 'Semester', 'Subject', 'Section', 'Grade', 
      'Activity', 'System', 'Profile', 'Schedule', 'Calendar'
    ]
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'targetType'
  },
  targetIdentifier: String, // Email, name, or other identifying info
  
  // Request information
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: String,
  
  // Additional context
  description: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Success/failure status
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: String,
  
  // Timestamps
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  collection: 'activity_logs'
});

// Indexes for efficient querying
activityLogSchema.index({ adminId: 1, timestamp: -1 }); // Legacy support
activityLogSchema.index({ userId: 1, timestamp: -1 }); // New universal field
activityLogSchema.index({ userType: 1, timestamp: -1 }); // New field
activityLogSchema.index({ action: 1, timestamp: -1 });
activityLogSchema.index({ category: 1, timestamp: -1 });
activityLogSchema.index({ ipAddress: 1, timestamp: -1 });
activityLogSchema.index({ targetType: 1, targetId: 1 });
activityLogSchema.index({ success: 1, timestamp: -1 });

// TTL index to automatically delete old logs (optional - keeps logs for 1 year)
activityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 }); // 365 days

// Static method to log activity
activityLogSchema.statics.logActivity = async function(logData) {
  try {
    // Handle backward compatibility - populate new fields from legacy fields if needed
    const processedData = { ...logData };
    
    if (!processedData.userId && processedData.adminId) {
      processedData.userId = processedData.adminId;
    }
    
    if (!processedData.userEmail && processedData.adminEmail) {
      processedData.userEmail = processedData.adminEmail;
    }
    
    if (!processedData.userType && processedData.adminId) {
      processedData.userType = 'admin';
    }
    
    const log = new this(processedData);
    await log.save();
    return log;
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw error to prevent breaking the main application flow
    return null;
  }
};

// Static method to get activity summary
activityLogSchema.statics.getActivitySummary = async function(filters = {}) {
  const pipeline = [];
  
  // Apply filters
  if (Object.keys(filters).length > 0) {
    pipeline.push({ $match: filters });
  }
  
  pipeline.push(
    {
      $group: {
        _id: {
          category: '$category',
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$timestamp'
            }
          }
        },
        count: { $sum: 1 },
        successCount: {
          $sum: { $cond: ['$success', 1, 0] }
        },
        failureCount: {
          $sum: { $cond: ['$success', 0, 1] }
        }
      }
    },
    {
      $sort: { '_id.date': -1, '_id.category': 1 }
    }
  );
  
  return await this.aggregate(pipeline);
};

// Static method to get security events
activityLogSchema.statics.getSecurityEvents = async function(filters = {}) {
  const securityFilters = {
    $or: [
      { category: 'SECURITY' },
      { success: false }
    ],
    ...filters
  };
  
  return await this.find(securityFilters)
    .sort({ timestamp: -1 })
    .populate('adminId', 'email fullName')
    .limit(100);
};

export default mongoose.model('ActivityLog', activityLogSchema);