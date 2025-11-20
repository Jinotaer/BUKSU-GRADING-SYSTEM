# Enhanced Multi-User Monitoring System

## Overview

The BUKSU Grading System now features a comprehensive monitoring system that tracks activities across all user types: **Admin**, **Instructor**, and **Student**. This system provides complete visibility into system usage, security events, and user behavior patterns.

## 🎯 Key Features

### **1. Multi-User Activity Tracking**
- **Admin Activities**: User management, system administration, academic management
- **Instructor Activities**: Section management, grading, schedule management, calendar sync
- **Student Activities**: Registration, profile updates, grade viewing, subject access

### **2. Enhanced Monitoring Dashboard**
- **Overview Tab**: System-wide statistics and trends
- **User Statistics Tab**: Breakdown by user type (Admin/Instructor/Student)
- **Activity Logs Tab**: Detailed activity logs with filtering
- **Security Events Tab**: Security-related events and failed operations

### **3. Comprehensive Filtering**
- Filter by user type (Admin, Instructor, Student)
- Filter by activity category
- Filter by severity level
- Filter by success/failure status
- Filter by date range
- Search by user email or description

## 📊 Monitored Activities

### **Admin Activities**
| Action | Category | Description |
|--------|----------|-------------|
| `LOGIN` | Authentication | Admin login attempts |
| `INSTRUCTOR_INVITED` | User Management | Instructor invitation |
| `STUDENT_DELETED` | User Management | Student account deletion |
| `SEMESTER_CREATED` | Academic Management | New semester creation |
| `SUBJECT_CREATED` | Academic Management | New subject creation |
| `SECTION_CREATED` | Academic Management | New section creation |

### **Instructor Activities**
| Action | Category | Description |
|--------|----------|-------------|
| `INSTRUCTOR_SECTION_ACCESSED` | Instructor Activity | Section access |
| `INSTRUCTOR_STUDENT_GRADED` | Grade Management | Student grading |
| `INSTRUCTOR_ACTIVITY_CREATED` | Academic Management | Activity creation |
| `INSTRUCTOR_GRADE_EXPORTED` | Grade Management | Grade export |
| `INSTRUCTOR_SCHEDULE_UPDATED` | Instructor Activity | Schedule updates |
| `INSTRUCTOR_CALENDAR_SYNCED` | Instructor Activity | Calendar synchronization |
| `PROFILE_VIEWED` | Profile Management | Profile viewing |
| `PROFILE_UPDATED` | Profile Management | Profile updates |

### **Student Activities**
| Action | Category | Description |
|--------|----------|-------------|
| `STUDENT_REGISTERED` | Student Activity | Student registration |
| `STUDENT_GRADE_VIEWED` | Student Activity | Grade viewing |
| `STUDENT_SCHEDULE_VIEWED` | Student Activity | Schedule viewing |
| `STUDENT_SUBJECT_ACCESSED` | Student Activity | Subject access |
| `STUDENT_ACTIVITY_SUBMITTED` | Student Activity | Activity submission |
| `PROFILE_VIEWED` | Profile Management | Profile viewing |
| `PROFILE_UPDATED` | Profile Management | Profile updates |

## 🔧 Technical Implementation

### **1. Universal Activity Log Model**
The enhanced `ActivityLog` model supports all user types:

```javascript
{
  userId: ObjectId,           // Universal user ID
  userEmail: String,          // User email
  userType: String,           // 'admin', 'instructor', 'student'
  action: String,             // Specific action performed
  category: String,           // Activity category
  severity: String,           // LOW, MEDIUM, HIGH, CRITICAL
  targetType: String,         // What was affected
  targetId: ObjectId,         // Target entity ID
  success: Boolean,           // Operation success status
  ipAddress: String,          // Request IP
  userAgent: String,          // Browser/app info
  description: String,        // Human-readable description
  metadata: Object,           // Additional context
  timestamp: Date             // When it occurred
}
```

### **2. Universal Audit Middleware**
The `universalAuditLogger` middleware automatically detects user type and logs activities:

```javascript
import { universalAuditLogger } from '../middleware/universalAuditLogger.js';

// Usage in routes
router.get('/profile', 
  userAuth, 
  universalAuditLogger('PROFILE_VIEWED', 'PROFILE_MANAGEMENT', 'LOW'), 
  getProfile
);
```

### **3. API Endpoints**

#### **Monitoring Endpoints** (Admin Access Only)
```
GET /api/monitoring/logs              - Get activity logs (all users)
GET /api/monitoring/security-events   - Get security events
GET /api/monitoring/stats             - Get system statistics
GET /api/monitoring/user-stats        - Get user type statistics
GET /api/monitoring/health            - Get system health
GET /api/monitoring/logs/export       - Export logs (CSV/JSON)
DELETE /api/monitoring/logs/cleanup   - Delete old logs
```

#### **Query Parameters**
```
?page=1                    - Page number
?limit=20                  - Records per page
?category=AUTHENTICATION   - Filter by category
?userType=instructor       - Filter by user type
?userEmail=john@email.com  - Filter by user email
?severity=HIGH             - Filter by severity
?success=true              - Filter by success status
?startDate=2024-01-01      - Date range start
?endDate=2024-12-31        - Date range end
?search=login              - Search in descriptions
```

## 📈 Dashboard Features

### **1. Overview Tab**
- **Total Activities**: System-wide activity count
- **Failed Activities**: Number of failed operations
- **Security Events**: High-priority security events
- **Success Rate**: Overall system success percentage
- **Activity Breakdown**: By category and severity
- **Recent Critical Events**: Latest high-priority events

### **2. User Statistics Tab**
- **Admin Activities**: Admin-specific activity metrics
- **Instructor Activities**: Instructor-specific metrics
- **Student Activities**: Student-specific metrics
- **Most Active Users**: Top users by activity count across all types
- **Activity Timeline**: Daily breakdown by user type

### **3. Activity Logs Tab**
- **Comprehensive Log View**: All activities in a searchable table
- **Real-time Filtering**: Filter by any combination of criteria
- **User Type Indicators**: Visual badges for user types
- **Success/Failure Icons**: Quick status identification
- **Detailed Descriptions**: Human-readable activity descriptions

### **4. Security Events Tab**
- **Security-focused View**: Failed operations, critical events
- **Severity Indicators**: Color-coded severity levels
- **IP Tracking**: Source IP addresses for security analysis
- **Failed Login Tracking**: Suspicious authentication attempts

## 🔒 Security Features

### **1. Automatic Security Detection**
- **Failed Login Attempts**: Automatically logged as security events
- **Account Lockouts**: High-severity security events
- **Multiple Failures**: Pattern detection for suspicious activity
- **IP Monitoring**: Track activities by source IP address

### **2. Severity Levels**
- **LOW**: Routine operations (viewing data, profile access)
- **MEDIUM**: Important operations (updates, enrollments)
- **HIGH**: Critical operations (deletions, system changes)
- **CRITICAL**: Security events, system failures

### **3. Data Protection**
- **No Sensitive Data**: Passwords and sensitive info never logged
- **Audit Trail**: Complete trail of who did what and when
- **IP Tracking**: Source IP addresses for security analysis
- **Automatic Cleanup**: Configurable log retention periods

## 🚀 Usage Guide

### **For System Administrators**

#### **1. Accessing the Monitoring Dashboard**
1. Log into the admin panel
2. Navigate to "System Monitoring" in the sidebar
3. Explore different tabs for various insights

#### **2. Monitoring User Activities**
1. Use the "User Statistics" tab to see activity by user type
2. Filter by specific user types or time periods
3. Identify most active users across the system

#### **3. Security Monitoring**
1. Check the "Security Events" tab regularly
2. Look for patterns in failed activities
3. Monitor IP addresses for suspicious activity
4. Export logs for external security analysis

#### **4. System Health Monitoring**
1. Monitor overall success rates
2. Track failed operations
3. Set up alerts for critical events (future feature)

### **For Development and Maintenance**

#### **1. Adding New Activity Logging**
```javascript
// In route files
import { universalAuditLogger } from '../middleware/universalAuditLogger.js';

router.post('/action', 
  authMiddleware,
  universalAuditLogger('ACTION_NAME', 'CATEGORY', 'SEVERITY'),
  controllerFunction
);
```

#### **2. Manual Logging**
```javascript
import { logUniversalActivity } from '../middleware/universalAuditLogger.js';

await logUniversalActivity(
  userId,
  userEmail,
  userType,
  'CUSTOM_ACTION',
  {
    category: 'CUSTOM_CATEGORY',
    severity: 'MEDIUM',
    description: 'Custom action description',
    success: true
  }
);
```

## 📊 Analytics and Reporting

### **Available Metrics**
- **Activity Counts**: By user type, category, time period
- **Success Rates**: Overall and by user type
- **User Engagement**: Most active users and usage patterns
- **Security Metrics**: Failed attempts, security events
- **System Performance**: Response times, error rates

### **Export Options**
- **CSV Format**: For spreadsheet analysis
- **JSON Format**: For programmatic processing
- **Filtered Exports**: Export only relevant data
- **Scheduled Exports**: (Future feature)

## 🔧 Configuration

### **Environment Variables**
```env
# Logging configuration
LOG_LEVEL=info
ENABLE_FILE_LOGGING=true

# Monitoring settings
LOG_RETENTION_PERIOD=31536000  # 1 year in seconds
MAX_EXPORT_RECORDS=10000       # Maximum records per export
```

### **Database Indexes**
The system includes optimized database indexes for:
- User ID and timestamp
- User type and timestamp
- Action and timestamp
- Category and timestamp
- IP address and timestamp

## 🔄 Future Enhancements

### **Planned Features**
1. **Real-time Alerts**: Email/SMS notifications for critical events
2. **Advanced Analytics**: Machine learning for anomaly detection
3. **Custom Dashboards**: User-configurable monitoring views
4. **API Rate Limiting**: Automatic protection against abuse
5. **Audit Compliance**: Export formats for compliance requirements
6. **Mobile Monitoring**: Mobile app for system monitoring

### **Integration Possibilities**
1. **External SIEM**: Integration with security monitoring systems
2. **Slack/Teams**: Notifications to team channels
3. **Grafana/Prometheus**: Advanced metrics and alerting
4. **ElasticSearch**: Advanced log search and analysis

## 🛠️ Troubleshooting

### **Common Issues**
1. **Missing Activities**: Check authentication middleware is applied
2. **Performance Issues**: Adjust log retention and cleanup schedules
3. **Export Timeouts**: Reduce export record limits
4. **Memory Usage**: Monitor database size and implement archiving

### **Debug Mode**
Enable debug logging by setting `LOG_LEVEL=debug` for detailed information.

## 📞 Support

For technical support or questions about the monitoring system:
1. Check the application logs for error messages
2. Verify database connectivity and indexes
3. Review middleware configuration
4. Contact the development team with specific error details

---

This enhanced monitoring system provides comprehensive visibility into your BUKSU Grading System, enabling proactive management, security monitoring, and data-driven decision making across all user types.