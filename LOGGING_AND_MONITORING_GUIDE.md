# System Logging and Monitoring Implementation Guide

## Overview

The BUKSU Grading System now includes comprehensive logging and monitoring capabilities for admin-side activities and security events. This system tracks all admin actions, provides security monitoring, and offers detailed analytics through a user-friendly dashboard.

## Features Implemented

### 1. Activity Logging Model (`ActivityLog`)
- **Location**: `backend/models/activityLog.js`
- **Purpose**: MongoDB model to store all system activities and security events
- **Key Fields**:
  - Admin information (ID, email)
  - Action details (action, category, severity)
  - Request information (IP address, user agent)
  - Target information (what was affected)
  - Success/failure status
  - Timestamps and metadata

### 2. Audit Middleware
- **Location**: `backend/middleware/auditLogger.js`
- **Purpose**: Automatically logs admin activities
- **Features**:
  - Automatic activity logging for all admin actions
  - Security event logging
  - Manual logging helper functions
  - Target extraction from requests/responses

### 3. Monitoring Controller
- **Location**: `backend/controller/monitoringController.js`
- **Endpoints**:
  - `GET /api/monitoring/logs` - Retrieve activity logs with filtering
  - `GET /api/monitoring/security-events` - Get security events
  - `GET /api/monitoring/stats` - Dashboard statistics
  - `GET /api/monitoring/health` - System health check
  - `GET /api/monitoring/logs/export` - Export logs (CSV/JSON)
  - `DELETE /api/monitoring/logs/cleanup` - Delete old logs

### 4. Frontend Monitoring Dashboard
- **Location**: `frontend/src/component/admin/monitoringDashboard.jsx`
- **Features**:
  - Overview dashboard with statistics
  - Activity logs viewer with filtering
  - Security events monitoring
  - Export functionality
  - Real-time data refresh

## Usage Guide

### For Administrators

#### 1. Accessing the Monitoring Dashboard
1. Log into the admin panel
2. Navigate to "System Monitoring" in the sidebar
3. The dashboard will show:
   - System statistics overview
   - Recent activities breakdown
   - Security events (if any)

#### 2. Viewing Activity Logs
- Switch to the "Activity Logs" tab
- Use filters to narrow down results:
  - Time period (24h, 7d, 30d)
  - Category (Authentication, User Management, etc.)
  - Severity level (Low, Medium, High, Critical)
  - Success/failure status
- Logs show detailed information about each admin action

#### 3. Monitoring Security Events
- Switch to the "Security Events" tab
- View high-priority events including:
  - Failed login attempts
  - Critical system actions
  - Security violations
  - Account lockouts

#### 4. Exporting Logs
- Click the "Export" button in the header
- Logs are exported in CSV format
- Exported files include all filtered data

### Automatically Logged Activities

#### Authentication Events
- Admin login attempts (successful/failed)
- Password reset requests and completions
- Account lockouts and unlocks

#### User Management
- Student creation, deletion, archiving
- Instructor invitations, deletion, archiving
- User status changes

#### Academic Management
- Semester creation, updates, deletion
- Subject creation, updates, deletion
- Section creation, updates, deletion
- Instructor assignments

#### System Events
- Data exports and imports
- System maintenance activities
- Configuration changes

## Security Features

### 1. Severity Levels
- **LOW**: Routine operations (viewing data, basic updates)
- **MEDIUM**: Important operations (creating/updating records)
- **HIGH**: Critical operations (deletions, major changes)
- **CRITICAL**: Security events, system failures

### 2. Automatic Security Detection
- Failed login attempts are automatically flagged
- Multiple failures trigger security events
- Account lockouts are logged as high-severity events
- Unusual activity patterns are detected

### 3. Data Protection
- Sensitive data is not logged (passwords, etc.)
- IP addresses and user agents are recorded for audit trails
- Logs are automatically cleaned up after configurable periods

## Technical Details

### Database Indexes
The ActivityLog model includes optimized indexes for:
- Admin ID and timestamp
- Action type and timestamp
- Category and timestamp
- Severity and timestamp
- IP address and timestamp
- Success status and timestamp

### Log Rotation
- Logs older than 1 year are automatically deleted (configurable)
- Critical security events are preserved longer
- Manual cleanup is available through the API

### Performance Considerations
- Logging operations are asynchronous to avoid blocking requests
- Database queries are optimized with proper indexing
- Export operations are limited to prevent system overload

## Configuration

### Environment Variables
Add these to your `.env` file for enhanced logging:
```env
# Enable file logging (optional)
ENABLE_FILE_LOGGING=true

# Log levels
LOG_LEVEL=info

# Log retention (in seconds, default 1 year)
LOG_RETENTION_PERIOD=31536000
```

### Winston Log Files (if file logging enabled)
- Combined logs: `backend/logs/combined-YYYY-MM-DD.log`
- Error logs: `backend/logs/error-YYYY-MM-DD.log`
- Auth logs: `backend/logs/auth-YYYY-MM-DD.log`

## API Endpoints

### Authentication Required
All monitoring endpoints require admin authentication.

### Query Parameters for Logs
- `page`: Page number (default: 1)
- `limit`: Records per page (default: 20)
- `category`: Filter by category
- `action`: Filter by action type
- `severity`: Filter by severity level
- `adminEmail`: Filter by admin email
- `success`: Filter by success status (true/false)
- `startDate`: Filter from date
- `endDate`: Filter to date
- `search`: Search in descriptions and emails

### Export Formats
- JSON: Default format with full metadata
- CSV: Simplified format for spreadsheet analysis

## Troubleshooting

### Common Issues

1. **Logs not appearing**: Check database connection and ensure ActivityLog model is properly imported
2. **Export not working**: Verify admin authentication and file permissions
3. **Performance issues**: Consider adjusting log retention period and implementing pagination

### Debug Mode
Enable debug logging by setting `LOG_LEVEL=debug` in your environment variables.

## Future Enhancements

### Possible Improvements
1. Real-time log streaming with WebSockets
2. Advanced analytics and reporting
3. Email alerts for critical security events
4. Integration with external monitoring services
5. Machine learning for anomaly detection

## Security Best Practices

1. **Regular Monitoring**: Check the security events tab regularly
2. **Export Logs**: Periodically export logs for offline analysis
3. **Review Patterns**: Look for unusual activity patterns
4. **Investigate Failures**: Always investigate failed operations
5. **Update Regularly**: Keep the system updated for security patches

## Conclusion

This comprehensive logging and monitoring system provides administrators with complete visibility into system activities and security events. It helps maintain security, comply with audit requirements, and troubleshoot issues effectively.

For technical support or questions about the monitoring system, refer to the system documentation or contact the development team.