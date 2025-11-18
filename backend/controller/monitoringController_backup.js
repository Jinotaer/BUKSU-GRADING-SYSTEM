import ActivityLog from '../models/activityLog.js';
import PDFDocument from 'pdfkit';

/**
 * Get activity logs with pagination and filtering
 */
export const getActivityLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      period = '7d',
      category,
      userType,
      success,
      severity,
      search
    } = req.query;

    // Build query filters
    const query = {};

    // Period filter
    if (period) {
      const now = new Date();
      const periodMap = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000
      };
      const periodMs = periodMap[period];
      if (periodMs) {
        query.timestamp = { $gte: new Date(now - periodMs) };
      }
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // User type filter
    if (userType) {
      query.userType = userType;
    }

    // Success filter
    if (success !== undefined && success !== '') {
      query.success = success === 'true';
    }

    // Search filter
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Get logs with pagination
    const logs = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const totalLogs = await ActivityLog.countDocuments(query);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalLogs / limitNum),
          totalLogs,
          itemsPerPage: limitNum
        }
      }
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs',
      error: error.message
    });
  }
};

/**
 * Get security events
 */
export const getSecurityEvents = async (req, res) => {
  try {
    const { page = 1, limit = 20, period = '7d' } = req.query;

    // Build query for security events
    const query = {
      $or: [
        { category: 'SECURITY' },
        { success: false },
        { action: { $in: ['LOGIN_FAILED', 'UNAUTHORIZED_ACCESS_ATTEMPT', 'SUSPICIOUS_ACTIVITY'] } }
      ]
    };

    // Period filter
    if (period) {
      const now = new Date();
      const periodMap = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000
      };
      const periodMs = periodMap[period];
      if (periodMs) {
        query.timestamp = { $gte: new Date(now - periodMs) };
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const events = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const totalEvents = await ActivityLog.countDocuments(query);

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalEvents / limitNum),
          totalEvents,
          itemsPerPage: limitNum
        }
      }
    });
  } catch (error) {
    console.error('Error fetching security events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch security events',
      error: error.message
    });
  }
};

/**
 * Get monitoring statistics
 */
export const getMonitoringStats = async (req, res) => {
  try {
    const { period = '7d' } = req.query;

    // Calculate date range
    const now = new Date();
    const periodMap = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000
    };
    const periodMs = periodMap[period] || periodMap['7d'];
    const startDate = new Date(now - periodMs);

    // Get total activity count
    const totalActivities = await ActivityLog.countDocuments({
      timestamp: { $gte: startDate }
    });

    // Get security events count
    const securityEvents = await ActivityLog.countDocuments({
      timestamp: { $gte: startDate },
      $or: [
        { category: 'SECURITY' },
        { success: false }
      ]
    });

    // Get failed logins
    const failedLogins = await ActivityLog.countDocuments({
      timestamp: { $gte: startDate },
      action: 'LOGIN_FAILED'
    });

    // Get active users
    const activeUsers = await ActivityLog.distinct('userId', {
      timestamp: { $gte: startDate }
    });

    // Get category breakdown
    const categoryStats = await ActivityLog.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get activity by user type
    const userTypeStats = await ActivityLog.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: '$userType',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalActivities,
          securityEvents,
          failedLogins,
          activeUsers: activeUsers.length
        },
        categoryBreakdown: categoryStats,
        userTypeBreakdown: userTypeStats
      }
    });
  } catch (error) {
    console.error('Error fetching monitoring stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monitoring statistics',
      error: error.message
    });
  }
};

/**
 * Get user type statistics
 */
export const getUserTypeStats = async (req, res) => {
  try {
    const { period = '7d' } = req.query;

    const now = new Date();
    const periodMap = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000
    };
    const periodMs = periodMap[period] || periodMap['7d'];
    const startDate = new Date(now - periodMs);

    const stats = await ActivityLog.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: '$userType',
          count: { $sum: 1 },
          successCount: { $sum: { $cond: ['$success', 1, 0] } },
          failureCount: { $sum: { $cond: ['$success', 0, 1] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching user type stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user type statistics',
      error: error.message
    });
  }
};

/**
 * Get system health status
 */
export const getSystemHealth = async (req, res) => {
  try {
    // Check recent error rate
    const now = new Date();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);

    const recentErrors = await ActivityLog.countDocuments({
      timestamp: { $gte: last24h },
      success: false
    });

    const recentTotal = await ActivityLog.countDocuments({
      timestamp: { $gte: last24h }
    });

    const errorRate = recentTotal > 0 ? (recentErrors / recentTotal) * 100 : 0;

    // Determine health status
    let status = 'healthy';
    if (errorRate > 10) status = 'critical';
    else if (errorRate > 5) status = 'warning';

    res.json({
      success: true,
      data: {
        status,
        errorRate: errorRate.toFixed(2),
        recentErrors,
        recentTotal,
        timestamp: now
      }
    });
  } catch (error) {
    console.error('Error checking system health:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check system health',
      error: error.message
    });
  }
};

/**
 * Export activity logs to PDF (A4 Landscape, no blank pages)
 */
export const exportLogs = async (req, res) => {
  try {
    const { period = '7d', category, userType, success } = req.query;

    // Build query
    const query = {};

    if (period) {
      const now = new Date();
      const periodMap = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000
      };
      const periodMs = periodMap[period];
      if (periodMs) {
        query.timestamp = { $gte: new Date(now - periodMs) };
      }
    }

    if (category) query.category = category;
    if (userType) query.userType = userType;
    if (success !== undefined && success !== '') {
      query.success = success === 'true';
    }

    // Fetch logs
    const logs = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .limit(1000) // Limit to prevent memory issues
      .lean();

    // Create PDF document - A4 Landscape
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 40,
      bufferPages: true
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=activity_logs_${new Date().toISOString().split('T')[0]}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // A4 Landscape dimensions
    const pageWidth = 842; // A4 landscape width in points
    const pageHeight = 595; // A4 landscape height in points
    const margin = 40;
    const contentWidth = pageWidth - (margin * 2);
    const contentHeight = pageHeight - (margin * 2);

    // Header function
    const addHeader = () => {
      doc.fontSize(18)
        .font('Helvetica-Bold')
        .text('Activity Logs Report', margin, margin, { align: 'center' });
      
      doc.fontSize(10)
        .font('Helvetica')
        .text(`Generated: ${new Date().toLocaleString()}`, margin, margin + 25, { align: 'center' });
      
      doc.fontSize(9)
        .text(`Period: ${period} | Total Logs: ${logs.length}`, margin, margin + 40, { align: 'center' });

      // Draw line
      doc.moveTo(margin, margin + 55)
        .lineTo(pageWidth - margin, margin + 55)
        .stroke();
    };

    // Generate digital signature (timestamp with milliseconds)
    const digitalSignature = `DS-${Date.now()}`;
    
    // Footer function
    const addFooter = (pageNum, totalPages) => {
      const footerY = pageHeight - margin + 10;
      
      // Digital signature on the left
      doc.fontSize(8)
        .font('Helvetica')
        .text(
          digitalSignature,
          margin,
          footerY,
          { align: 'left', width: contentWidth / 2 }
        );
      
      // Page number on the right
      doc.fontSize(8)
        .font('Helvetica')
        .text(
          `Page ${pageNum} of ${totalPages}`,
          pageWidth / 2,
          footerY,
          { align: 'right', width: contentWidth / 2 }
        );
    };

    // Table configuration
    const tableTop = margin + 70;
    const rowHeight = 32; // Optimized row height
    const colWidths = {
      timestamp: 85,
      userType: 65,
      action: 120,
      category: 100,
      user: 130,
      ip: 80,
      status: 50,
      description: 132
    };

    // Calculate how many rows fit per page (accounting for header, footer, and table header)
    const headerSpace = 85; // Space used by page header and table header
    const footerSpace = 30; // Space for footer
    const availableHeight = contentHeight - headerSpace - footerSpace;
    const rowsPerPage = Math.floor(availableHeight / rowHeight);

    // First pass: calculate total pages (ensure at least 1 page)
    const totalPages = Math.max(1, Math.ceil(logs.length / rowsPerPage));

    let currentPage = 1;
    let yPosition = tableTop;

    // Add first page header
    addHeader();

    // Table headers
    const drawTableHeader = (y) => {
      doc.fontSize(9).font('Helvetica-Bold');
      
      let x = margin;
      doc.text('Timestamp', x, y, { width: colWidths.timestamp, align: 'left' });
      x += colWidths.timestamp;
      
      doc.text('Type', x, y, { width: colWidths.userType, align: 'left' });
      x += colWidths.userType;
      
      doc.text('Action', x, y, { width: colWidths.action, align: 'left' });
      x += colWidths.action;
      
      doc.text('Category', x, y, { width: colWidths.category, align: 'left' });
      x += colWidths.category;
      
      doc.text('User', x, y, { width: colWidths.user, align: 'left' });
      x += colWidths.user;
      
      doc.text('IP Address', x, y, { width: colWidths.ip, align: 'left' });
      x += colWidths.ip;
      
      doc.text('Status', x, y, { width: colWidths.status, align: 'left' });
      x += colWidths.status;
      
      doc.text('Description', x, y, { width: colWidths.description, align: 'left' });

      // Draw line under header
      doc.moveTo(margin, y + 12)
        .lineTo(pageWidth - margin, y + 12)
        .stroke();

      return y + 18;
    };

    yPosition = drawTableHeader(yPosition);

    // Draw table rows
    logs.forEach((log, index) => {
      // Check if we need a new page
      if (yPosition + rowHeight > pageHeight - margin - 20) {
        // Add footer to current page
        addFooter(currentPage, totalPages);
        
        // Add new page
        doc.addPage({
          size: 'A4',
          layout: 'landscape',
          margin: margin
        });
        
        currentPage++;
        yPosition = tableTop;
        
        // Add header to new page
        addHeader();
        yPosition = drawTableHeader(yPosition);
      }

      doc.fontSize(8).font('Helvetica');
      
      let x = margin;
      
      // Timestamp
      const timestamp = new Date(log.timestamp).toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(timestamp, x, yPosition, { width: colWidths.timestamp, align: 'left' });
      x += colWidths.timestamp;
      
      // User Type
      doc.text(log.userType || 'N/A', x, yPosition, { width: colWidths.userType, align: 'left' });
      x += colWidths.userType;
      
      // Action
      doc.text(log.action || 'N/A', x, yPosition, { width: colWidths.action, align: 'left' });
      x += colWidths.action;
      
      // Category
      doc.text(log.category || 'N/A', x, yPosition, { width: colWidths.category, align: 'left' });
      x += colWidths.category;
      
      // User (email or identifier)
      const userInfo = log.userEmail || log.targetIdentifier || 'N/A';
      doc.text(userInfo, x, yPosition, { width: colWidths.user, align: 'left', ellipsis: true });
      x += colWidths.user;
      
      // IP Address
      doc.text(log.ipAddress || 'N/A', x, yPosition, { width: colWidths.ip, align: 'left' });
      x += colWidths.ip;
      
      // Status
      doc.fillColor(log.success ? 'green' : 'red')
        .text(log.success ? '✓' : '✗', x, yPosition, { width: colWidths.status, align: 'center' })
        .fillColor('black');
      x += colWidths.status;
      
      // Description
      doc.text(log.description || 'N/A', x, yPosition, { 
        width: colWidths.description, 
        align: 'left',
        ellipsis: true,
        height: rowHeight - 5
      });

      // Draw light separator line
      yPosition += rowHeight - 2;
      doc.strokeColor('#E5E7EB')
        .moveTo(margin, yPosition)
        .lineTo(pageWidth - margin, yPosition)
        .stroke()
        .strokeColor('black');
      
      yPosition += 2;
    });

    // Add footer to last page
    addFooter(currentPage, totalPages);

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error exporting logs:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to export logs',
        error: error.message
      });
    }
  }
};

/**
 * Delete old logs (maintenance)
 */
export const deleteOldLogs = async (req, res) => {
  try {
    const { daysOld = 365 } = req.query;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysOld));

    const result = await ActivityLog.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    // Log this maintenance action
    await ActivityLog.logActivity({
      userId: req.user?.id,
      userEmail: req.user?.email,
      userType: 'admin',
      action: 'SYSTEM_MAINTENANCE',
      category: 'SYSTEM',
      description: `Deleted ${result.deletedCount} logs older than ${daysOld} days`,
      ipAddress: req.ip,
      success: true
    });

    res.json({
      success: true,
      data: {
        deletedCount: result.deletedCount,
        cutoffDate
      }
    });
  } catch (error) {
    console.error('Error deleting old logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete old logs',
      error: error.message
    });
  }
};
