import ActivityLog from '../models/activityLog.js';
import PDFDocument from 'pdfkit';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Get activity logs with pagination and filtering
 */
export const getActivityLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      userType,
      success,
      search
    } = req.query;

    // Build query
    const query = {};

    // Additional filters
    if (category) query.category = category;
    if (userType) query.userType = userType;
    if (success !== undefined && success !== '') {
      query.success = success === 'true';
    }

    // Search filter
    if (search) {
      query.$or = [
        { userEmail: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { ipAddress: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    console.log('Final query:', JSON.stringify(query, null, 2));

    // Execute query
    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ActivityLog.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalLogs: total,
          hasNext: skip + logs.length < total,
          hasPrev: page > 1
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
 * Get security events (failed logins, suspicious activities)
 */
export const getSecurityEvents = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    // Build query for security events
    const query = {
      $or: [
        { success: false }, // Failed activities
        { category: 'SECURITY' }, // Security-related events
        { action: { $regex: /login|auth/i } } // Authentication events
      ]
    };

    const events = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: {
        events,
        count: events.length
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
    // Calculate time range (default to last 24 hours)
    const now = new Date();
    const startTime = new Date(now - 24 * 60 * 60 * 1000);

    // Aggregate statistics
    const [stats] = await ActivityLog.aggregate([
      {
        $match: {
          timestamp: { $gte: startTime }
        }
      },
      {
        $group: {
          _id: null,
          totalActivities: { $sum: 1 },
          securityEvents: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$success', false] },
                    { $eq: ['$category', 'SECURITY'] }
                  ]
                },
                1,
                0
              ]
            }
          },
          failedLogins: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$success', false] },
                    { $regexMatch: { input: '$action', regex: /login|auth/i } }
                  ]
                },
                1,
                0
              ]
            }
          },
          activeUsers: { $addToSet: '$userEmail' }
        }
      }
    ]);

    // Category breakdown
    const categoryStats = await ActivityLog.aggregate([
      {
        $match: { timestamp: { $gte: startTime } }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          successRate: {
            $avg: {
              $cond: ['$success', 1, 0]
            }
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // User type breakdown
    const userTypeStats = await ActivityLog.aggregate([
      {
        $match: { timestamp: { $gte: startTime } }
      },
      {
        $group: {
          _id: '$userType',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalActivities: stats?.totalActivities || 0,
          securityEvents: stats?.securityEvents || 0,
          failedLogins: stats?.failedLogins || 0,
          activeUsers: stats?.activeUsers?.length || 0
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
 * Get user type statistics with success/failure breakdown
 */
export const getUserTypeStats = async (req, res) => {
  try {
    // Calculate time range (default to last 7 days)
    const now = new Date();
    const startTime = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const stats = await ActivityLog.aggregate([
      {
        $match: {
          timestamp: { $gte: startTime }
        }
      },
      {
        $group: {
          _id: '$userType',
          total: { $sum: 1 },
          successful: {
            $sum: {
              $cond: ['$success', 1, 0]
            }
          },
          failed: {
            $sum: {
              $cond: ['$success', 0, 1]
            }
          },
          uniqueUsers: { $addToSet: '$userEmail' }
        }
      },
      {
        $project: {
          userType: '$_id',
          total: 1,
          successful: 1,
          failed: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          successRate: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$successful', '$total'] },
                  100
                ]
              },
              2
            ]
          }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        stats
      }
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
 * Get system health metrics
 */
export const getSystemHealth = async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);

    // Calculate error rate over last 24 hours
    const [healthStats] = await ActivityLog.aggregate([
      {
        $match: {
          timestamp: { $gte: last24h }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          errors: {
            $sum: {
              $cond: ['$success', 0, 1]
            }
          }
        }
      },
      {
        $project: {
          total: 1,
          errors: 1,
          errorRate: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$errors', '$total'] },
                  100
                ]
              },
              2
            ]
          }
        }
      }
    ]);

    // Determine health status
    const errorRate = healthStats?.errorRate || 0;
    let status = 'healthy';
    let statusColor = 'green';

    if (errorRate > 10) {
      status = 'critical';
      statusColor = 'red';
    } else if (errorRate > 5) {
      status = 'warning';
      statusColor = 'orange';
    }

    res.json({
      success: true,
      data: {
        status,
        statusColor,
        metrics: {
          errorRate: errorRate,
          totalActivities: healthStats?.total || 0,
          totalErrors: healthStats?.errors || 0
        },
        timestamp: now
      }
    });
  } catch (error) {
    console.error('Error fetching system health:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system health',
      error: error.message
    });
  }
};

/**
 * Delete old activity logs (maintenance function)
 */
export const deleteOldLogs = async (req, res) => {
  try {
    const { days = 365 } = req.query; // Default to 365 days
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const result = await ActivityLog.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} old log entries`,
      data: {
        deletedCount: result.deletedCount,
        cutoffDate: cutoffDate
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
/**
 * Export activity logs to PDF (A4 Landscape, no blank pages)
 */
export const exportLogs = async (req, res) => {
  try {
    const { category, userType, success } = req.query;

    // Build query
    const query = {};

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
      bufferPages: true // Important for adding footers to all pages
    });

    // Set response headers with timestamp
    const now = new Date();
    const dateTimeString = now.toISOString()
      .replace(/T/, '_')           // Replace T with underscore
      .replace(/:/g, '-')          // Replace colons with hyphens (Windows filename compatibility)
      .replace(/\.\d{3}Z$/, '');   // Remove milliseconds and Z
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Buksu_Grading_System_Activity_Logs_Report_${dateTimeString}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // A4 Landscape dimensions
    const pageWidth = 842; // A4 landscape width in points
    const pageHeight = 595; // A4 landscape height in points
    const margin = 40;
    const contentWidth = pageWidth - (margin * 2);

    // Header function
    const addHeader = () => {
      // Title with background
      doc.rect(margin, margin, contentWidth, 50)
        .fillAndStroke('#1e40af', '#1e40af');
      
      doc.fontSize(20)
        .font('Helvetica-Bold')
        .fillColor('white')
        .text('Activity Logs Report', margin, margin + 8, { align: 'center', width: contentWidth });
      
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('white')
        .text(`Generated: ${new Date().toLocaleString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })}`, margin, margin + 30, { align: 'center', width: contentWidth });
      
      // Info bar
      doc.fillColor('black')
        .fontSize(9)
        .font('Helvetica')
        .text(`Total Records: ${logs.length}`, margin, margin + 58, { align: 'center', width: contentWidth });

      // Draw line
      doc.moveTo(margin, margin + 73)
        .lineTo(pageWidth - margin, margin + 73)
        .strokeColor('#d1d5db')
        .lineWidth(1)
        .stroke()
        .strokeColor('black')
        .lineWidth(1);
    };

    // Table configuration
    const tableTop = margin + 85;
    const rowHeight = 30;
    const colWidths = {
      timestamp: 85,
      userType: 65,
      action: 115,
      category: 95,
      user: 125,
      ip: 80,
      status: 55,
      description: 142
    };

    // Fixed rows per page
    const rowsPerPage = 10;

    // Only create pages if we have logs
    if (logs.length === 0) {
      // Add first page header
      addHeader();
      let yPosition = drawTableHeader(tableTop);
      
      // Add "No data" message
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#6b7280')
        .text('No activity logs found.', margin, yPosition + 20, { 
          align: 'center', 
          width: contentWidth 
        });
      
      // Add footer for empty case - use direct positioning
      const footerY = 565; // Fixed Y coordinate for A4 landscape
      
      // Generate real PDF digital signature for empty case
      const documentHash = pdfSigner.createDocumentHash({ logs: [], timestamp: new Date() });
      const digitalSignature = pdfSigner.signDocument(documentHash, { totalLogs: 0 });
      const displaySig = pdfSigner.addSignatureToPDF(doc, digitalSignature);
      
      // Digital signature area - Left side
      doc.fontSize(8)
        .font('Helvetica')
        .fillColor('#000')
        .text(`BGS - ${displaySig}`, 40, footerY - 25);
      
      // Signature line
      doc.moveTo(40, footerY - 5)
        .lineTo(200, footerY - 5)
        .strokeColor('#000')
        .lineWidth(1)
        .stroke();
      
      // // Signature label
      // doc.fontSize(8)
      //   .font('Helvetica-Oblique')
      //   .fillColor('#666')
      //   .text('Digital Signature', 40, footerY + 5);
      
      // Page numbers - Right side (aligned with Authorized Signatory)
      doc.fontSize(8)
        .font('Helvetica')
        .fillColor('#000')
        .text('Page 1 of 1', 720, footerY - 25);
      
      doc.end();
      return;
    }

    let currentPage = 1;
    let yPosition = tableTop;

    // Add first page header
    addHeader();

    // Table headers function
    const drawTableHeader = (y) => {
      doc.fontSize(9).font('Helvetica-Bold');
      
      let x = margin;
      
      // Draw header cells with borders
      doc.rect(x, y, colWidths.timestamp, 15).stroke();
      doc.text('Timestamp', x + 2, y + 3, { width: colWidths.timestamp - 4, align: 'left' });
      x += colWidths.timestamp;
      
      doc.rect(x, y, colWidths.userType, 15).stroke();
      doc.text('Type', x + 2, y + 3, { width: colWidths.userType - 4, align: 'left' });
      x += colWidths.userType;
      
      doc.rect(x, y, colWidths.action, 15).stroke();
      doc.text('Action', x + 2, y + 3, { width: colWidths.action - 4, align: 'left' });
      x += colWidths.action;
      
      doc.rect(x, y, colWidths.category, 15).stroke();
      doc.text('Category', x + 2, y + 3, { width: colWidths.category - 4, align: 'left' });
      x += colWidths.category;
      
      doc.rect(x, y, colWidths.user, 15).stroke();
      doc.text('User', x + 2, y + 3, { width: colWidths.user - 4, align: 'left' });
      x += colWidths.user;
      
      doc.rect(x, y, colWidths.ip, 15).stroke();
      doc.text('IP Address', x + 2, y + 3, { width: colWidths.ip - 4, align: 'left' });
      x += colWidths.ip;
      
      doc.rect(x, y, colWidths.status, 15).stroke();
      doc.text('Status', x + 2, y + 3, { width: colWidths.status - 4, align: 'left' });
      x += colWidths.status;
      
      doc.rect(x, y, colWidths.description, 15).stroke();
      doc.text('Description', x + 2, y + 3, { width: colWidths.description - 4, align: 'left' });

      return y + 15;
    };

    yPosition = drawTableHeader(yPosition);

    // Draw table rows
    logs.forEach((log, index) => {
      // Check if we need a new page (after every 10 rows)
      if (index > 0 && index % rowsPerPage === 0) {
        // Add footer to current page before adding new page - use direct positioning
        const footerY = 565; // Fixed Y coordinate for A4 landscape
        
        // Generate real PDF digital signature for page break
        const documentHash = pdfSigner.createDocumentHash({ logs: logs.slice(0, index), timestamp: new Date() });
        const digitalSignature = pdfSigner.signDocument(documentHash, { 
          totalLogs: logs.length, 
          currentPage: currentPage
        });
        const displaySig = pdfSigner.addSignatureToPDF(doc, digitalSignature);
        
        // Digital signature area - Left side
        doc.fontSize(8)
          .font('Helvetica')
          .fillColor('#000')
          .text(`BGS - ${displaySig}`, 40, footerY - 25);
        
        // // Signature label
        // doc.fontSize(8)
        //   .font('Helvetica-Oblique')
        //   .fillColor('#666')
        //   .text('Digital Signature', 40, footerY + 5);
        
        // Page numbers - Right side (aligned with Authorized Signatory)
        doc.fontSize(8)
          .font('Helvetica')
          .fillColor('#000')
          .text(`Page ${currentPage} of ${Math.ceil(logs.length / rowsPerPage)}`, 720, footerY - 25);
        
        // Add new page
        doc.addPage({
          size: 'A4',
          layout: 'landscape',
          margin: margin
        });
        
        currentPage++;
        
        // Add header to new page
        addHeader();
        yPosition = drawTableHeader(tableTop);
      }

      doc.fontSize(8).font('Helvetica');
      
      let x = margin;
      
      // Timestamp cell
      const timestamp = new Date(log.timestamp).toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.rect(x, yPosition, colWidths.timestamp, rowHeight).stroke();
      doc.text(timestamp, x + 2, yPosition + 10, { width: colWidths.timestamp - 4, align: 'left' });
      x += colWidths.timestamp;
      
      // User Type cell
      doc.rect(x, yPosition, colWidths.userType, rowHeight).stroke();
      doc.text(log.userType || 'N/A', x + 2, yPosition + 10, { width: colWidths.userType - 4, align: 'left' });
      x += colWidths.userType;
      
      // Action cell
      doc.rect(x, yPosition, colWidths.action, rowHeight).stroke();
      doc.text(log.action || 'N/A', x + 2, yPosition + 10, { width: colWidths.action - 4, align: 'left' });
      x += colWidths.action;
      
      // Category cell
      doc.rect(x, yPosition, colWidths.category, rowHeight).stroke();
      doc.text(log.category || 'N/A', x + 2, yPosition + 10, { width: colWidths.category - 4, align: 'left' });
      x += colWidths.category;
      
      // User cell (email or identifier)
      const userInfo = log.userEmail || log.targetIdentifier || 'N/A';
      doc.rect(x, yPosition, colWidths.user, rowHeight).stroke();
      doc.text(userInfo, x + 2, yPosition + 10, { width: colWidths.user - 4, align: 'left', ellipsis: true });
      x += colWidths.user;
      
      // IP Address cell
      doc.rect(x, yPosition, colWidths.ip, rowHeight).stroke();
      doc.text(log.ipAddress || 'N/A', x + 2, yPosition + 10, { width: colWidths.ip - 4, align: 'left' });
      x += colWidths.ip;
      
      // Status cell
      doc.rect(x, yPosition, colWidths.status, rowHeight).stroke();
      const statusText = log.success ? 'Success' : 'Failed';
      doc.fillColor(log.success ? 'green' : 'red')
        .text(statusText, x + 2, yPosition + 10, { width: colWidths.status - 4, align: 'center' })
        .fillColor('black');
      x += colWidths.status;
      
      // Description cell
      doc.rect(x, yPosition, colWidths.description, rowHeight).stroke();
      doc.text(log.description || 'N/A', x + 2, yPosition + 10, { 
        width: colWidths.description - 4, 
        align: 'left',
        ellipsis: true,
        height: rowHeight - 4
      });

      yPosition += rowHeight;
    });

    // Add footer to the last page - use direct positioning
    const footerY = 565; // Fixed Y coordinate for A4 landscape
    
    // Generate real PDF digital signature for final page
    const documentHash = pdfSigner.createDocumentHash({ logs, timestamp: new Date() });
    const digitalSignature = pdfSigner.signDocument(documentHash, { 
      totalLogs: logs.length, 
      finalPage: true
    });
    const displaySig = pdfSigner.addSignatureToPDF(doc, digitalSignature);
    
    // Digital signature area - Left side
      doc.fontSize(8)
          .font('Helvetica')
          .fillColor('#000')
          .text(`BGS - ${displaySig}`, 40, footerY - 25);
    
    // // Signature line
    // doc.moveTo(40, footerY - 5)
    //   .lineTo(200, footerY - 5)
    //   .strokeColor('#000')
    //   .lineWidth(1)
    //   .stroke();
    
    // // Signature label
    // doc.fontSize(8)
    //   .font('Helvetica-Oblique')
    //   .fillColor('#666')
    //   .text('Digital Signature', 40, footerY + 5);
    
    // Page numbers - Right side (aligned with Authorized Signatory)
    doc.fontSize(8)
      .font('Helvetica')
      .fillColor('#000')
      .text(`Page ${currentPage} of ${Math.ceil(logs.length / rowsPerPage)}`, 720, footerY - 25);
    
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

// PDF Digital Signature Implementation
class PDFDigitalSigner {
  constructor() {
    this.authority = 'Buksu Grading System';
    this.version = '1.0';
    this.generateKeyPair();
  }

  // Generate RSA key pair for signing
  generateKeyPair() {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });
    
    this.privateKey = privateKey;
    this.publicKey = publicKey;
  }

  // Create document hash
  createDocumentHash(content) {
    return crypto.createHash('sha256').update(JSON.stringify(content)).digest('hex');
  }

  // Generate real digital signature using RSA
  signDocument(documentHash, metadata = {}) {
    const timestamp = new Date().toISOString();
    const signatureData = {
      documentHash,
      timestamp,
      authority: this.authority,
      version: this.version,
      metadata
    };

    // Create signature using private key (real cryptographic signature)
    const dataToSign = JSON.stringify(signatureData);
    const signature = crypto.sign('sha256', Buffer.from(dataToSign), {
      key: this.privateKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    });

    return {
      signature: signature.toString('base64'),
      signatureData,
      publicKey: this.publicKey,
      algorithm: 'RSA-PSS-SHA256',
      displaySignature: signature.toString('hex').substring(0, 16) // For display in PDF
    };
  }

  // Verify signature (for validation)
  verifySignature(signature, signatureData, publicKey = null) {
    try {
      const keyToUse = publicKey || this.publicKey;
      const dataToVerify = JSON.stringify(signatureData);
      
      return crypto.verify(
        'sha256',
        Buffer.from(dataToVerify),
        {
          key: keyToUse,
          padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        },
        Buffer.from(signature, 'base64')
      );
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  // Add digital signature to PDF metadata
  addSignatureToPDF(doc, digitalSignature) {
    // Add signature information to PDF metadata
    doc.info.Title = 'Buksu Grading System - Activity Logs Report';
    doc.info.Author = this.authority;
    doc.info.Subject = 'Digitally Signed Activity Logs';
    doc.info.Creator = `${this.authority} Digital Signer v${this.version}`;
    doc.info.Producer = 'BGS PDF Digital Signature System';
    doc.info.CreationDate = new Date(digitalSignature.signatureData.timestamp);
    doc.info.ModDate = new Date();
    
    // Custom metadata for signature verification
    doc.info.DigitalSignature = digitalSignature.signature;
    doc.info.SignatureAlgorithm = digitalSignature.algorithm;
    doc.info.DocumentHash = digitalSignature.signatureData.documentHash;
    doc.info.SignatureTimestamp = digitalSignature.signatureData.timestamp;
    doc.info.PublicKey = digitalSignature.publicKey;
    
    return digitalSignature.displaySignature;
  }
}

// Create global signer instance
const pdfSigner = new PDFDigitalSigner();

// Footer implementation now uses direct positioning for consistent results