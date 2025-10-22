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
}

export default new EmailService();
