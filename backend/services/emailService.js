import nodemailer from "nodemailer";

class EmailService {
  constructor() {
    this.initializeTransporter();
  }

  async initializeTransporter() {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn(
        "⚠️ SMTP credentials not configured. Email sending will be disabled."
      );
      this.transporter = null;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.SMTP_USER || "u7382361@gmail.com",
          pass: process.env.SMTP_PASS || "vkksgvimarbfttgi",
        },
      });

      console.log("✅ Email transporter initialized with Gmail service");
    } catch (error) {
      console.error(
        "❌ Failed to initialize email transporter:",
        error.message
      );
      this.transporter = null;
    }
  }

  async verifyConnection() {
    if (!this.transporter) {
      console.log("⚠️ Email transporter not configured");
      return false;
    }

    try {
      await this.transporter.verify();
      console.log("✅ Email server connection verified successfully");
      return true;
    } catch (error) {
      console.warn("⚠️ Email server connection failed:", error.message);
      return false;
    }
  }

  async ensureTransporter() {
    if (!this.transporter) {
      await this.initializeTransporter();
    }
    return this.transporter !== null;
  }

  // 📩 Send student account status notification (Approved / Rejected)
  async sendAccountStatusNotification(email, status, firstName, lastName) {
    if (!(await this.ensureTransporter())) {
      return {
        success: false,
        message: "Email service not configured",
      };
    }

    const subject =
      status === "approved"
        ? "BUKSU Grading System - Account Approved"
        : "BUKSU Grading System - Account Rejected";

    const statusMessage =
      status === "approved"
        ? "Your student account has been approved! You can now log in to the system."
        : `Unfortunately, your student account application has been rejected. 
           Please contact the registrar's office for clarification or to reapply.`;

    const statusColor = status === "approved" ? "#28a745" : "#dc3545";

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${statusColor};">BUKSU Grading System</h2>
          <p>Dear ${firstName} ${lastName},</p>
          <p>${statusMessage}</p>
          <p>Best regards,<br>BUKSU Grading System Team</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`📧 Status notification email sent to ${email}`);
      return { success: true, message: "Status email sent successfully" };
    } catch (error) {
      console.error("❌ Error sending status email:", error);
      return {
        success: false,
        message: "Failed to send status email",
        error: error.message,
      };
    }
  }

  // 📨 Send Instructor Invitation
  async sendInstructorInvitation(email, token, invitedBy) {
    if (!(await this.ensureTransporter())) {
      return {
        success: false,
        message: "Email service not configured",
      };
    }

    const loginUrl = `${
      process.env.FRONTEND_URL || "http://localhost:5173"
    }/instructor/login`;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: "Welcome to BUKSU Grading System - Instructor Account Activated",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007bff;">BUKSU Grading System - Instructor Account Activated</h2>
          <p>Dear Instructor,</p>
          <p>You have been invited by <strong>${invitedBy}</strong> to join the BUKSU Grading System as an instructor.</p>
          <p><strong>Your account has been automatically approved and is ready to use!</strong></p>
          <p>Please click the link below to access the system:</p>
          <p><a href="${loginUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Access Grading System</a></p>
          <p>You can log in using your institutional Google account (@buksu.edu.ph).</p>
          <p>Best regards,<br>BUKSU Grading System Team</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`📧 Invitation email sent to ${email}`);
      return { success: true, message: "Invitation email sent successfully" };
    } catch (error) {
      console.error("❌ Error sending invitation email:", error);
      return {
        success: false,
        message: "Failed to send invitation email",
        error: error.message,
      };
    }
  }

  // 🎉 Send Welcome Email
  async sendWelcomeEmail(email, fullName, role) {
    if (!(await this.ensureTransporter())) {
      return {
        success: false,
        message: "Email service not configured",
      };
    }

    const subject = `Welcome to BUKSU Grading System - ${role} Account`;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">Welcome to BUKSU Grading System!</h2>
          <p>Dear ${fullName},</p>
          <p>Welcome to the BUKSU Grading System! Your ${role.toLowerCase()} account has been successfully activated.</p>
          <p>Best regards,<br>BUKSU Grading System Team</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`📧 Welcome email sent to ${email}`);
      return { success: true, message: "Welcome email sent successfully" };
    } catch (error) {
      console.error("❌ Error sending welcome email:", error);
      return {
        success: false,
        message: "Failed to send welcome email",
        error: error.message,
      };
    }
  }

  // 📧 Send Subject Assignment Notification to Instructor
  async sendSubjectAssignmentNotification(
    instructorEmail,
    subjectDetails,
    assignedBy
  ) {
    if (!(await this.ensureTransporter())) {
      return {
        success: false,
        message: "Email service not configured",
      };
    }

    const subject = "New Subject Assignment - BUKSU Grading System";

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: instructorEmail,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007bff;">BUKSU Grading System - Subject Assignment</h2>
          <p>Dear Instructor,</p>
          <p>You have been assigned a new subject by <strong>${assignedBy}</strong>:</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Subject Details:</h3>
            <p><strong>Subject Code:</strong> ${subjectDetails.subjectCode}</p>
            <p><strong>Subject Name:</strong> ${subjectDetails.subjectName}</p>
            <p><strong>Units:</strong> ${subjectDetails.units}</p>
            <p><strong>College:</strong> ${subjectDetails.college}</p>
            <p><strong>Department:</strong> ${subjectDetails.department}</p>
            <p><strong>Semester:</strong> ${subjectDetails.semester}</p>
          </div>
          
          <p>Please log in to the BUKSU Grading System to view this subject and create sections for your students.</p>
          
          <p><a href="${
            process.env.FRONTEND_URL || "http://localhost:5173"
          }/instructor/login" 
             style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
             Access Grading System
          </a></p>
          
          <p>Best regards,<br>BUKSU Grading System Team</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`📧 Subject assignment email sent to ${instructorEmail}`);
      return {
        success: true,
        message: "Subject assignment email sent successfully",
      };
    } catch (error) {
      console.error("❌ Error sending subject assignment email:", error);
      return {
        success: false,
        message: "Failed to send subject assignment email",
        error: error.message,
      };
    }
  }

  // 📧 Send Section Assignment Notification to Instructor
  async sendSectionAssignmentNotification(
    instructorEmail,
    instructorName,
    sectionDetails,
    assignedBy
  ) {
    if (!(await this.ensureTransporter())) {
      return {
        success: false,
        message: "Email service not configured",
      };
    }

    const subject = "New Section Assignment - BUKSU Grading System";

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || "u7382361@gmail.com",
      to: instructorEmail,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007bff;">BUKSU Grading System - Section Assignment</h2>
          <p>Dear ${instructorName},</p>
          <p>You have been assigned to a new section by <strong>${assignedBy}</strong>:</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Section Details:</h3>
            <p><strong>Subject Code:</strong> ${sectionDetails.subjectCode}</p>
            <p><strong>Subject Name:</strong> ${sectionDetails.subjectName}</p>
            <p><strong>Section:</strong> ${sectionDetails.sectionName}</p>
            <p><strong>Units:</strong> ${sectionDetails.units}</p>
            <p><strong>College:</strong> ${sectionDetails.college}</p>
            <p><strong>Department:</strong> ${sectionDetails.department}</p>
            <p><strong>School Year:</strong> ${sectionDetails.schoolYear}</p>
            <p><strong>Term:</strong> ${sectionDetails.term} Semester</p>
          </div>
          
          <p>You can now manage this section, add students, and input grades through the instructor portal.</p>
          
          <p><a href="${
            process.env.FRONTEND_URL || "http://localhost:5173"
          }/instructor/login" 
             style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
             Access Instructor Portal
          </a></p>
          
          <p>Best regards,<br>BUKSU Grading System Team</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`📧 Section assignment email sent to ${instructorEmail}`);
      return {
        success: true,
        message: "Section assignment email sent successfully",
      };
    } catch (error) {
      console.error("❌ Error sending section assignment email:", error);
      return {
        success: false,
        message: "Failed to send section assignment email",
        error: error.message,
      };
    }
  }

  // 📧 Send Section Invitation to Students
  async sendSectionInvitation(
    studentEmail,
    studentName,
    sectionDetails,
    instructorName
  ) {
    if (!(await this.ensureTransporter())) {
      return {
        success: false,
        message: "Email service not configured",
      };
    }

    const subject = "Section Invitation - BUKSU Grading System";

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: studentEmail,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">BUKSU Grading System - Section Invitation</h2>
          <p>Dear ${studentName},</p>
          <p>You have been invited by <strong>${instructorName}</strong> to join the following section:</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Section Details:</h3>
            <p><strong>Subject:</strong> ${sectionDetails.subjectCode} - ${
        sectionDetails.subjectName
      }</p>
            <p><strong>Section:</strong> ${sectionDetails.sectionName}</p>
            <p><strong>Instructor:</strong> ${instructorName}</p>
            <p><strong>School Year:</strong> ${sectionDetails.schoolYear}</p>
            <p><strong>Term:</strong> ${sectionDetails.term} Semester</p>
          </div>
          
          <p>Please log in to the BUKSU Grading System to view your enrolled sections and track your academic progress.</p>
          
          <p><a href="${
            process.env.FRONTEND_URL || "http://localhost:5173"
          }/student/login" 
             style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
             Access Grading System
          </a></p>
          
          <p>Best regards,<br>BUKSU Grading System Team</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`📧 Section invitation email sent to ${studentEmail}`);
      return {
        success: true,
        message: "Section invitation email sent successfully",
      };
    } catch (error) {
      console.error("❌ Error sending section invitation email:", error);
      return {
        success: false,
        message: "Failed to send section invitation email",
        error: error.message,
      };
    }
  }

  // 🧪 Test Email Server
  async testEmailConnection() {
    if (!(await this.ensureTransporter())) {
      return { success: false, message: "Email transporter not available" };
    }

    try {
      await this.verifyConnection();
      return { success: true, message: "Email connection test successful" };
    } catch (error) {
      return {
        success: false,
        message: "Email connection test failed",
        error: error.message,
      };
    }
  }

  // 📧 Send Admin Password Reset Code
  async sendAdminResetCode(email, adminName, passcode) {
    if (!(await this.ensureTransporter())) {
      return {
        success: false,
        message: "Email service not configured",
      };
    }

    const subject = "BUKSU Grading System - Admin Password Reset Code";
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #007bff;">BUKSU Grading System</h2>
        <p>Dear ${adminName},</p>
        <p>You have requested to reset your admin password.</p>
        <p>Your one-time passcode is:</p>
        <h2 style="background:#f8f9fa; padding:10px 20px; border-radius:8px; display:inline-block; letter-spacing:3px;">${passcode}</h2>
        <p>This code expires in <strong>15 minutes</strong>.</p>
        <p>If you did not request this, please ignore this message.</p>
        <p>Best regards,<br>BUKSU Grading System Team</p>
      </div>
    `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`📧 Admin reset code sent to ${email}`);
      return { success: true, message: "Reset code email sent successfully" };
    } catch (error) {
      console.error("❌ Error sending admin reset email:", error);
      return {
        success: false,
        message: "Failed to send admin reset email",
        error: error.message,
      };
    }
  }

// 📧 Notify student: a score was posted/updated
async sendActivityScoreNotification({
  studentEmail,
  studentName,
  instructorName,
  sectionName,
  subjectCode,
  subjectName,
  activityTitle,
  score,
  maxScore,
  viewUrl, // optional link to student portal page
}) {
  if (!(await this.ensureTransporter())) {
    return { success: false, message: "Email service not configured" };
  }

  const percentage = maxScore > 0 ? ((score / maxScore) * 100).toFixed(1) : 0;
  const isPassing = percentage >= 60; // Adjust passing threshold as needed
  const headerColor = isPassing ? '#28a745' : '#ffc107';

  const subject = `[${subjectCode}] Score Posted: ${activityTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; border: 2px solid ${headerColor}; border-radius: 8px; overflow: hidden;">
      <div style="background-color: ${isPassing ? '#d4edda' : '#fff3cd'}; padding: 20px; border-bottom: 2px solid ${headerColor};">
        <h2 style="color: ${isPassing ? '#155724' : '#856404'}; margin: 0;">${isPassing ? '✅' : '📊'} BUKSU Grading System - Score Posted</h2>
      </div>
      
      <div style="padding: 24px; background-color: white;">
        <p style="font-size: 16px;">Hi <strong>${studentName || "Student"}</strong>,</p>
        
        <p style="font-size: 15px;">Your instructor <strong>${instructorName || "Your Instructor"}</strong> has posted a score for the following activity:</p>
        
        <div style="background-color: #f8f9fa; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${headerColor};">
          <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="padding: 6px 0;"><strong>📚 Course:</strong> ${subjectCode} — ${subjectName}</li>
            <li style="padding: 6px 0;"><strong>👥 Section:</strong> ${sectionName}</li>
            <li style="padding: 6px 0;"><strong>📝 Activity:</strong> ${activityTitle}</li>
            <li style="padding: 6px 0;"><strong>👨‍🏫 Instructor:</strong> ${instructorName || "Your Instructor"}</li>
            <li style="padding: 6px 0;"><strong>📊 Max Score:</strong> ${maxScore}</li>
          </ul>
        </div>
        
        <div style="background-color: ${isPassing ? '#d4edda' : '#fff3cd'}; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${headerColor}; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">Your Score</p>
          <p style="margin: 0; font-size: 32px; font-weight: bold; color: ${headerColor};">${score} / ${maxScore}</p>
          <p style="margin: 8px 0 0 0; font-size: 18px; font-weight: bold; color: ${isPassing ? '#155724' : '#856404'};">${percentage}%</p>
        </div>
        
        <div style="background-color: ${isPassing ? '#d4edda' : '#fff3cd'}; padding: 12px 16px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: ${isPassing ? '#155724' : '#856404'}; font-size: 14px;">
            <strong>${isPassing ? '🎉 Great job!' : '📌 Keep working hard!'}</strong> ${isPassing ? 'You scored above the passing threshold.' : 'Remember that every score is an opportunity to learn and improve.'}
          </p>
        </div>
        
        ${viewUrl ? `
        <p style="text-align: center; margin: 30px 0;">
          <a href="${viewUrl}" 
             style="display: inline-block; background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            View Your Grades
          </a>
        </p>
        ` : ""}
        
        <p style="color: #666; font-size: 13px; border-top: 1px solid #e0e0e0; padding-top: 16px; margin-top: 24px;">
          This is an automated notification from BUKSU Grading System. You are receiving this because your instructor has posted a score for your activity.
        </p>
      </div>
    </div>
  `;

  try {
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: studentEmail,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending score email:", error?.message || error);
    return { success: false, message: "Failed to send score email" };
  }
}

// 📧 Notify student: no score recorded for activity
async sendNoScoreNotification({
  studentEmail,
  studentName,
  instructorName,
  sectionName,
  subjectCode,
  subjectName,
  activityTitle,
  maxScore,
  viewUrl,
}) {
  if (!(await this.ensureTransporter())) {
    return { success: false, message: "Email service not configured" };
  }

  const subject = `[${subjectCode}] Notice: No score recorded for ${activityTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; border: 2px solid #ffc107; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #fff3cd; padding: 20px; border-bottom: 2px solid #ffc107;">
        <h2 style="color:#856404; margin: 0;">⚠️ BUKSU Grading System - Score Notice</h2>
      </div>
      
      <div style="padding: 24px; background-color: white;">
        <p style="font-size: 16px;">Hi <strong>${studentName || "Student"}</strong>,</p>
        
        <p style="font-size: 15px;">This is to inform you that <strong>no score has been recorded</strong> for the following activity:</p>
        
        <div style="background-color: #f8f9fa; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="padding: 6px 0;"><strong>📚 Course:</strong> ${subjectCode} — ${subjectName}</li>
            <li style="padding: 6px 0;"><strong>👥 Section:</strong> ${sectionName}</li>
            <li style="padding: 6px 0;"><strong>📝 Activity:</strong> ${activityTitle}</li>
            <li style="padding: 6px 0;"><strong>👨‍🏫 Instructor:</strong> ${instructorName || "Your Instructor"}</li>
            <li style="padding: 6px 0;"><strong>📊 Max Score:</strong> ${maxScore}</li>
            <li style="padding: 6px 0; color: #dc3545;"><strong>⚠️ Your Score:</strong> Not yet recorded (0/${maxScore})</li>
          </ul>
        </div>
        
        <div style="background-color: #fff3cd; padding: 12px 16px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            <strong>📌 Important:</strong> This may be because you did not submit the activity, were absent, or your work has not yet been graded. Please contact your instructor <strong>${instructorName || "your instructor"}</strong> if you believe this is an error.
          </p>
        </div>
        
        ${viewUrl ? `
        <p style="text-align: center; margin: 30px 0;">
          <a href="${viewUrl}" 
             style="display: inline-block; background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            View Your Grades
          </a>
        </p>
        ` : ""}
        
        <p style="color: #666; font-size: 13px; border-top: 1px solid #e0e0e0; padding-top: 16px; margin-top: 24px;">
          This is an automated notification from BUKSU Grading System. You are receiving this because grades were recently posted for this activity.
        </p>
      </div>
    </div>
  `;

  try {
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: studentEmail,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending no-score email:", error?.message || error);
    return { success: false, message: "Failed to send no-score email" };
  }
}

  // 📧 Send Schedule Notification to Students
  async sendScheduleNotification({
    studentEmail,
    studentName,
    instructorName,
    scheduleDetails,
  }) {
    if (!(await this.ensureTransporter())) {
      return {
        success: false,
        message: "Email service not configured",
      };
    }

    const { title, eventType, startDateTime, endDateTime, location, description, sectionName, subjectCode, subjectName } = scheduleDetails;

    // Format dates
    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);
    const formattedStartDate = startDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const formattedStartTime = startDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
    const formattedEndTime = endDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });

    // Event type colors
    const eventColors = {
      quiz: '#dc3545',
      laboratory: '#ffc107',
      exam: '#007bff',
      assignment: '#fd7e14',
      project: '#28a745',
      other: '#6c757d'
    };

    const eventColor = eventColors[eventType] || eventColors.other;

    const subject = `New ${eventType.charAt(0).toUpperCase() + eventType.slice(1)}: ${title} - ${subjectCode}`;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: studentEmail,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: ${eventColor}; color: white; padding: 20px;">
            <h2 style="margin: 0; font-size: 24px;">📅 New Schedule Added</h2>
          </div>
          
          <div style="padding: 30px;">
            <p>Dear <strong>${studentName}</strong>,</p>
            
            <p>Your instructor <strong>${instructorName}</strong> has scheduled a new <strong style="color: ${eventColor};">${eventType.toUpperCase()}</strong>:</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${eventColor};">
              <h3 style="color: #333; margin-top: 0; font-size: 20px;">${title}</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; width: 120px;">📚 <strong>Subject:</strong></td>
                  <td style="padding: 8px 0;">${subjectCode} - ${subjectName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">👥 <strong>Section:</strong></td>
                  <td style="padding: 8px 0;">${sectionName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">📅 <strong>Date:</strong></td>
                  <td style="padding: 8px 0;">${formattedStartDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">⏰ <strong>Time:</strong></td>
                  <td style="padding: 8px 0;">${formattedStartTime} - ${formattedEndTime}</td>
                </tr>
                ${location ? `
                <tr>
                  <td style="padding: 8px 0; color: #666;">📍 <strong>Location:</strong></td>
                  <td style="padding: 8px 0;">${location}</td>
                </tr>
                ` : ''}
                ${description ? `
                <tr>
                  <td style="padding: 8px 0; color: #666; vertical-align: top;">📝 <strong>Description:</strong></td>
                  <td style="padding: 8px 0;">${description}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #856404;">⚠️ <strong>Reminder:</strong> Please mark your calendar and prepare accordingly.</p>
            </div>
            
            <p style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/student/schedule" 
                 style="background-color: ${eventColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                View Full Schedule
              </a>
            </p>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              This is an automated notification from BUKSU Grading System. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`📧 Schedule notification email sent to ${studentEmail}`);
      return {
        success: true,
        message: "Schedule notification email sent successfully",
      };
    } catch (error) {
      console.error("❌ Error sending schedule notification email:", error);
      return {
        success: false,
        message: "Failed to send schedule notification email",
        error: error.message,
      };
    }
  }

}



export default new EmailService();
