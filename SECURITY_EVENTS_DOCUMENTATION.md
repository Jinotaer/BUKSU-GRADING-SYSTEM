# Security Events Documentation
**Buksu Grading System - Security Monitoring Guide**

## Overview

Security Events are critical system alerts that track and monitor potentially harmful or suspicious activities within the Buksu Grading System. This comprehensive monitoring system helps administrators maintain system security, detect unauthorized access attempts, and ensure compliance with security standards.

## Table of Contents
- [What Are Security Events](#what-are-security-events)
- [How Security Events Work](#how-security-events-work)
- [Types of Security Events](#types-of-security-events)
- [Security Event Detection](#security-event-detection)
- [Accessing Security Events](#accessing-security-events)
- [Testing Security Events](#testing-security-events)
- [API Reference](#api-reference)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## What Are Security Events

Security Events are automatically generated log entries that capture:
- **Failed authentication attempts**
- **Unauthorized access attempts**
- **System errors and failures**
- **Suspicious user activities**
- **Account management issues**
- **Data validation failures**

### Key Characteristics:
- **Real-time Detection**: Events are logged immediately when they occur
- **Automatic Classification**: System automatically identifies security-relevant activities
- **Comprehensive Logging**: Includes user info, timestamps, IP addresses, and detailed descriptions
- **Dashboard Integration**: Accessible through the admin monitoring dashboard

## How Security Events Work

### Detection Criteria
An activity becomes a Security Event if it meets **any** of these conditions:

1. **Category-based**: `category: 'SECURITY'`
2. **Failure-based**: `success: false` (any failed operation)

### Backend Implementation
```javascript
// Security events filter in monitoringController.js
const filter = {
  $or: [
    { category: 'SECURITY' },     // Explicitly security-related activities
    { success: false }            // Any failed system operation
  ]
};
```

### Event Structure
```javascript
{
  "_id": "ObjectId",
  "userId": "ObjectId",           // User who triggered the event
  "userEmail": "user@example.com",
  "userType": "admin|instructor|student",
  "action": "LOGIN_FAILED",       // Specific action that occurred
  "category": "SECURITY",         // Event category
  "success": false,               // Operation result
  "ipAddress": "192.168.1.1",    // Source IP address
  "userAgent": "Mozilla/5.0...",  // Browser/client info
  "description": "Login attempt failed for admin@test.com",
  "timestamp": "2025-11-17T10:30:00Z",
  "metadata": {                   // Additional context
    "attemptCount": 3,
    "reason": "Invalid password"
  }
}
```

## Types of Security Events

### 1. Authentication Events
| Action | Description | Trigger Condition |
|--------|-------------|------------------|
| `LOGIN_FAILED` | Failed login attempts | Invalid credentials provided |
| `UNAUTHORIZED_ACCESS_ATTEMPT` | Access without proper authentication | Missing or invalid tokens |
| `PASSWORD_RESET_REQUESTED` | Password reset initiated | User requests password change |
| `ACCOUNT_LOCKED` | Account temporarily disabled | Too many failed attempts |

### 2. Authorization Events
| Action | Description | Trigger Condition |
|--------|-------------|------------------|
| `INSUFFICIENT_PERMISSIONS` | User lacks required privileges | Role-based access denied |
| `RESOURCE_ACCESS_DENIED` | Access to protected resource blocked | Unauthorized resource access |
| `TOKEN_EXPIRED` | Authentication token invalid | Session timeout or token manipulation |

### 3. Data Validation Events
| Action | Description | Trigger Condition |
|--------|-------------|------------------|
| `VALIDATION_ERROR` | Invalid data submission | Data doesn't meet schema requirements |
| `MALFORMED_REQUEST` | Improperly formatted API request | Invalid JSON or missing fields |
| `SUSPICIOUS_INPUT` | Potentially malicious data detected | SQL injection attempts, XSS, etc. |

### 4. System Events
| Action | Description | Trigger Condition |
|--------|-------------|------------------|
| `DATABASE_ERROR` | Database operation failure | Connection issues, query failures |
| `FILE_SYSTEM_ERROR` | File operations failed | Upload/download problems |
| `RATE_LIMIT_EXCEEDED` | Too many requests from user | Brute force protection triggered |

### 5. Account Management Events
| Action | Description | Trigger Condition |
|--------|-------------|------------------|
| `ACCOUNT_DELETED` | User account removal | High-impact administrative action |
| `PERMISSION_CHANGED` | User role/permissions modified | Privilege escalation attempts |
| `PROFILE_MANIPULATION` | Suspicious profile changes | Unusual profile modifications |

## Security Event Detection

### Automatic Detection
The system automatically creates Security Events for:

#### Failed Operations (success: false)
- Login failures
- API validation errors
- Database operation failures
- File upload/processing errors
- Permission violations

#### Security Category Activities
- Explicit security-related actions
- Account lockouts
- Suspicious activities flagged by admins
- System security violations

### Manual Security Event Creation
Developers can manually log security events:

```javascript
import { logUniversalActivity } from '../middleware/universalAuditLogger.js';

// Log a custom security event
await logUniversalActivity(
  userId,
  userEmail,
  userType,
  'SUSPICIOUS_ACTIVITY',
  {
    category: 'SECURITY',
    success: false,
    description: 'Multiple failed attempts to access restricted data',
    metadata: {
      attemptCount: 5,
      targetResource: '/api/admin/sensitive-data',
      timeWindow: '5 minutes'
    }
  }
);
```

## Accessing Security Events

### Admin Dashboard
1. **Login** to the admin panel
2. **Navigate** to "System Monitoring" in the sidebar
3. **Click** on "Security Events" tab
4. **Filter** events by:
   - Time period (24h, 7d, 30d)
   - User type (admin, instructor, student)
   - Success/failure status

### Dashboard Features
- **Real-time Updates**: Events appear immediately
- **Detailed Information**: Full event context and metadata
- **User Identification**: See which user triggered each event
- **Timestamp Tracking**: Precise timing of security incidents
- **IP Address Logging**: Track source of security events
- **Export Capability**: Download security reports

### Security Events Table Columns
| Column | Description |
|--------|-------------|
| **Timestamp** | When the event occurred |
| **User** | User email and type who triggered the event |
| **Action** | Specific action that was attempted |
| **Category** | Event classification (SECURITY, AUTHENTICATION, etc.) |
| **Status** | Success (✓) or Failure (✗) indicator |
| **Description** | Human-readable explanation of what happened |

## Testing Security Events

### 1. Authentication Testing

#### Test Failed Login
```bash
# Using curl
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "wrongpassword"
  }'
```

#### Expected Result:
- Status: 401 Unauthorized
- Security Event: `LOGIN_FAILED`
- Category: `AUTHENTICATION`

### 2. Authorization Testing

#### Test Unauthorized Access
```bash
# Access protected route without token
curl -X GET http://localhost:5000/api/admin/instructors

# Access with invalid token
curl -X GET http://localhost:5000/api/admin/instructors \
  -H "Authorization: Bearer invalid_token_here"
```

#### Expected Result:
- Status: 401/403
- Security Event: `UNAUTHORIZED_ACCESS_ATTEMPT`
- Category: `SECURITY`

### 3. Data Validation Testing

#### Test Invalid Data Submission
```bash
# Submit invalid student data
curl -X POST http://localhost:5000/api/admin/students \
  -H "Authorization: Bearer YOUR_VALID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "not-an-email",
    "studentId": "",
    "fullName": ""
  }'
```

#### Expected Result:
- Status: 400 Bad Request
- Security Event: `VALIDATION_ERROR`
- Category: `USER_MANAGEMENT`

### 4. Rate Limiting Testing

#### Test Brute Force Protection
```bash
# Make multiple rapid requests (adjust URL and method as needed)
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/admin/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@test.com","password":"wrong"}' &
done
wait
```

#### Expected Result:
- Status: 429 Too Many Requests (after threshold)
- Security Event: `RATE_LIMIT_EXCEEDED`
- Category: `SECURITY`

### 5. Frontend Testing

#### Manual Testing Steps:
1. **Open Admin Dashboard**
2. **Try Invalid Login**: Use wrong credentials
3. **Check Security Events Tab**: Verify failed login appears
4. **Test Invalid Forms**: Submit forms with missing/invalid data
5. **Verify Real-time Updates**: Events should appear immediately

## API Reference

### Get Security Events
```http
GET /api/admin/monitoring/security-events
```

#### Query Parameters:
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `page` | number | Page number | 1 |
| `limit` | number | Events per page | 20 |
| `startDate` | string | Start date (ISO format) | - |
| `endDate` | string | End date (ISO format) | - |
| `period` | string | Time period (24h, 7d, 30d) | - |

#### Example Request:
```bash
curl -X GET "http://localhost:5000/api/admin/monitoring/security-events?period=24h&limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Example Response:
```json
{
  "success": true,
  "events": [
    {
      "_id": "674a123...",
      "userEmail": "admin@test.com",
      "userType": "admin",
      "action": "LOGIN_FAILED",
      "category": "AUTHENTICATION",
      "success": false,
      "ipAddress": "192.168.1.100",
      "description": "Login attempt failed - invalid password",
      "timestamp": "2025-11-17T14:30:15.123Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalEvents": 45,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Export Security Events
```http
GET /api/admin/monitoring/logs/export?format=csv&period=7d
```

#### Supported Formats:
- **JSON**: Complete event data with metadata
- **CSV**: Simplified format for spreadsheet analysis

## Best Practices

### For Administrators

#### 1. Regular Monitoring
- **Daily Review**: Check security events at least once daily
- **Pattern Recognition**: Look for recurring issues or unusual spikes
- **User Behavior**: Monitor for suspicious user activities
- **System Health**: Track failure rates and error patterns

#### 2. Alert Thresholds
Consider setting up alerts for:
- **Multiple Failed Logins**: 5+ failures in 10 minutes
- **Unauthorized Access**: Any 401/403 responses
- **System Errors**: Database or file system failures
- **Rate Limiting**: Brute force attempts

#### 3. Investigation Workflow
When security events occur:
1. **Assess Severity**: Determine if immediate action needed
2. **Investigate Context**: Review related events and user history
3. **Document Findings**: Record investigation results
4. **Take Action**: Implement necessary security measures
5. **Follow-up**: Monitor for recurring issues

### For Developers

#### 1. Security Event Guidelines
- **Log All Failures**: Every failed operation should create a security event
- **Include Context**: Provide meaningful descriptions and metadata
- **Protect Sensitive Data**: Never log passwords or personal information
- **Use Appropriate Categories**: Choose correct event categories

#### 2. Code Examples

```javascript
// Good: Comprehensive security logging
try {
  const user = await authenticateUser(credentials);
  // Success - normal logging
} catch (error) {
  await logUniversalActivity(
    null,
    credentials.email,
    'unknown',
    'LOGIN_FAILED',
    {
      category: 'AUTHENTICATION',
      success: false,
      description: `Login failed: ${error.message}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: {
        errorCode: error.code,
        attemptTime: new Date()
      }
    }
  );
  throw error;
}
```

## Troubleshooting

### Common Issues

#### 1. Security Events Not Appearing
**Possible Causes:**
- Database connection issues
- Middleware not properly configured
- Event filtering too restrictive

**Solutions:**
- Check database connectivity
- Verify `universalAuditLogger` is imported and used
- Review security event filter criteria

#### 2. Too Many Security Events
**Possible Causes:**
- Overly broad failure detection
- System configuration issues
- Legitimate high-traffic periods

**Solutions:**
- Review event generation criteria
- Implement more specific failure categorization
- Adjust monitoring thresholds

#### 3. Missing Event Details
**Possible Causes:**
- Incomplete logging implementation
- Missing request context
- Frontend display issues

**Solutions:**
- Ensure all required fields are logged
- Verify middleware captures request information
- Check frontend component rendering

### Debug Mode
Enable detailed logging by setting environment variable:
```bash
LOG_LEVEL=debug npm run dev
```

### Database Queries
Direct database inspection:
```javascript
// Find recent security events
db.activity_logs.find({
  $or: [
    { category: 'SECURITY' },
    { success: false }
  ],
  timestamp: { $gte: new Date(Date.now() - 24*60*60*1000) }
}).sort({ timestamp: -1 });
```

## Security Considerations

### Data Protection
- **No Sensitive Information**: Never log passwords, tokens, or personal data
- **IP Address Logging**: Helps track attack sources but consider privacy regulations
- **Data Retention**: Automatically clean old logs (configurable retention period)
- **Access Control**: Only authorized administrators can view security events

### Privacy Compliance
- **User Notification**: Consider notifying users of security events affecting their accounts
- **Data Minimization**: Log only necessary information for security purposes
- **Audit Trails**: Maintain logs for compliance and investigation purposes

### Performance Impact
- **Asynchronous Logging**: Security event logging doesn't block application performance
- **Database Optimization**: Proper indexing ensures fast security event queries
- **Rate Limiting**: Prevent log flooding from automated attacks

---

## Conclusion

The Security Events system provides comprehensive monitoring and alerting capabilities for the Buksu Grading System. By automatically detecting and logging security-relevant activities, administrators can:

- **Maintain System Security**: Early detection of potential threats
- **Ensure Compliance**: Complete audit trails for security incidents
- **Monitor User Behavior**: Track and investigate suspicious activities
- **Improve System Health**: Identify and resolve recurring issues

Regular monitoring and proper configuration of security events are essential for maintaining a secure and reliable grading system environment.

---

*Last Updated: November 17, 2025*
*Version: 1.0*