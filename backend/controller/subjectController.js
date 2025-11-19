// controllers/subjectController.js
import Subject from "../models/subjects.js";
import Semester from "../models/semester.js";
import Instructor from "../models/instructor.js";
import Section from "../models/sections.js";
import Activity from "../models/activity.js";
import emailService from "../services/emailService.js";
import { calculateAndUpdateAllGradesInSection } from "../utils/gradeCalculator.js";

export const addSubject = async (req, res) => {
  try {
    const { subjectCode, subjectName, units, college, department, semester, instructorId } = req.body;
    if (!subjectCode || !subjectName || !units || !college || !department || !semester) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const semesterExists = await Semester.findById(semester);
    if (!semesterExists) return res.status(404).json({ message: "Semester not found" });

    // Check if instructor exists (if provided)
    let instructor = null;
    if (instructorId) {
      instructor = await Instructor.findById(instructorId);
      if (!instructor) return res.status(404).json({ message: "Instructor not found" });
    }

    const exists = await Subject.findOne({ subjectCode, semester });
    if (exists) return res.status(400).json({ message: "Subject code already exists for this semester" });

    const subject = await Subject.create({
      subjectCode, subjectName, units, college, department, semester, assignedInstructor: instructorId || null,
    });

    const populatedSubject = await Subject.findById(subject._id)
      .populate("semester")
      .populate("assignedInstructor", "fullName email college department");

    // Send email notification to instructor if assigned
    if (instructor) {
      const adminUser = req.admin || req.user; // Get admin info from request
      const adminName = adminUser?.fullName || "System Administrator";
      
      const subjectDetails = {
        subjectCode,
        subjectName,
        units,
        college,
        department,
        semester: `${semesterExists.schoolYear} - ${semesterExists.term} Semester`
      };

      try {
        await emailService.sendSubjectAssignmentNotification(
          instructor.email,
          subjectDetails,
          adminName
        );
      } catch (emailError) {
        console.error("Failed to send subject assignment email:", emailError);
        // Don't fail the request if email fails
      }
    }

    res.status(201).json({ success: true, subject: populatedSubject });
  } catch (err) {
    console.error("addSubject:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const assignInstructorToSubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { instructorId } = req.body;

    if (!instructorId) {
      return res.status(400).json({ message: "Instructor ID is required" });
    }

    const subject = await Subject.findById(subjectId).populate("semester");
    if (!subject) return res.status(404).json({ message: "Subject not found" });

    const instructor = await Instructor.findById(instructorId);
    if (!instructor) return res.status(404).json({ message: "Instructor not found" });

    // Update subject with assigned instructor
    subject.assignedInstructor = instructorId;
    await subject.save();

    const populatedSubject = await Subject.findById(subject._id)
      .populate("semester")
      .populate("assignedInstructor", "fullName email college department");

    // Send email notification to instructor
    const adminUser = req.admin || req.user;
    const adminName = adminUser?.fullName || "System Administrator";
    
    const subjectDetails = {
      subjectCode: subject.subjectCode,
      subjectName: subject.subjectName,
      units: subject.units,
      college: subject.college,
      department: subject.department,
      semester: `${subject.semester.schoolYear} - ${subject.semester.term} Semester`
    };

    try {
      await emailService.sendSubjectAssignmentNotification(
        instructor.email,
        subjectDetails,
        adminName
      );
    } catch (emailError) {
      console.error("Failed to send subject assignment email:", emailError);
    }

    res.json({ success: true, subject: populatedSubject, message: "Instructor assigned successfully" });
  } catch (err) {
    console.error("assignInstructorToSubject:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getSubjectsBySemester = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const subjects = await Subject.find({ semester: semesterId })
      .populate("semester")
      .populate("assignedInstructor", "fullName email college department");
    res.json(subjects);
  } catch (err) {
    console.error("getSubjectsBySemester:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const listSubjects = async (req, res) => {
  try {
    const { includeArchived = false } = req.query;
    
    const filter = {};
    if (includeArchived !== 'true') {
      filter.isArchived = { $ne: true };
    }
    
    const subjects = await Subject.find(filter)
      .populate("semester")
      .populate("assignedInstructor", "fullName email college department")
      .sort({ subjectCode: 1 });
    res.json({ success: true, subjects });
  } catch (err) {
    console.error("listSubjects:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAssignedSubjects = async (req, res) => {
  try {
    const instructorId = req.instructor.id; // From instructor auth middleware
    
    const subjects = await Subject.find({ assignedInstructor: instructorId })
      .populate("semester")
      .populate("assignedInstructor", "fullName email college department")
      .sort({ createdAt: -1 });

    res.json({ success: true, subjects });
  } catch (err) {
    console.error("getAssignedSubjects:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { subjectCode, subjectName, units, college, department, semester, instructorId } = req.body;

    console.log("🔄 UPDATE SUBJECT - Received request:");
    console.log("📋 Subject ID:", id);
    console.log("📦 Request body:", req.body);

    if (!subjectCode || !subjectName || !units || !college || !department || !semester) {
      console.log("❌ Missing required fields");
      return res.status(400).json({ message: "All fields are required" });
    }

    const semesterExists = await Semester.findById(semester);
    if (!semesterExists) {
      console.log("❌ Semester not found:", semester);
      return res.status(404).json({ message: "Semester not found" });
    }
    console.log("✅ Semester found:", semesterExists.schoolYear, "-", semesterExists.term);

    // Check if instructor exists (if provided)
    if (instructorId) {
      const instructor = await Instructor.findById(instructorId);
      if (!instructor) {
        console.log("❌ Instructor not found:", instructorId);
        return res.status(404).json({ message: "Instructor not found" });
      }
      console.log("✅ Instructor found:", instructor.fullName);
    }

    // Check if another subject exists with the same subjectCode and semester
    const exists = await Subject.findOne({ 
      subjectCode, 
      semester, 
      _id: { $ne: id } 
    });
    
    if (exists) {
      console.log("❌ Duplicate subject code for semester");
      return res.status(400).json({ message: "Subject code already exists for this semester" });
    }

    // Get old subject data to check if semester changed
    const oldSubject = await Subject.findById(id);
    if (!oldSubject) {
      console.log("❌ Subject not found");
      return res.status(404).json({ message: "Subject not found" });
    }

    const semesterChanged = oldSubject.semester.toString() !== semester.toString();

    console.log("🔄 Updating subject in database...");
    const subject = await Subject.findByIdAndUpdate(
      id,
      { 
        subjectCode, 
        subjectName, 
        units, 
        college, 
        department, 
        semester,
        assignedInstructor: instructorId || null
      },
      { new: true, runValidators: true }
    ).populate("semester").populate("assignedInstructor", "fullName email college department");

    // If semester changed, update all related sections and activities
    if (semesterChanged) {
      console.log("📅 Semester changed! Updating related sections and activities...");
      
      // Update all sections for this subject
      const sectionUpdateResult = await Section.updateMany(
        { subject: id },
        { 
          $set: { 
            schoolYear: semesterExists.schoolYear,
            term: semesterExists.term
          }
        }
      );
      console.log(`✅ Updated ${sectionUpdateResult.modifiedCount} sections to match new semester`);

      // Update all activities for this subject
      const activityUpdateResult = await Activity.updateMany(
        { subject: id },
        { 
          $set: { 
            semester: semester,
            schoolYear: semesterExists.schoolYear,
            term: semesterExists.term === "1st" ? "Midterm" : semesterExists.term === "2nd" ? "Finalterm" : "Summer"
          }
        }
      );
      console.log(`✅ Updated ${activityUpdateResult.modifiedCount} activities to match new semester`);

      // Recalculate grades for all affected sections
      const affectedSections = await Section.find({ subject: id });
      for (const section of affectedSections) {
        try {
          await calculateAndUpdateAllGradesInSection(section._id);
          console.log(`✅ Recalculated grades for section ${section._id}`);
        } catch (gradeError) {
          console.error(`❌ Error recalculating grades for section ${section._id}:`, gradeError);
        }
      }
    }

    console.log("✅ Subject updated successfully:", subject);
    res.json({ success: true, subject });
  } catch (err) {
    console.error("💥 updateSubject error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    const subject = await Subject.findByIdAndDelete(id);
    
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    res.json({ success: true, message: "Subject deleted successfully" });
  } catch (err) {
    console.error("deleteSubject:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Archive subject
export const archiveSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.admin.email;

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    if (subject.isArchived) {
      return res.status(400).json({
        success: false,
        message: "Subject is already archived",
      });
    }

    subject.isArchived = true;
    subject.archivedAt = new Date();
    subject.archivedBy = adminEmail;
    await subject.save();

    const populatedSubject = await Subject.findById(subject._id)
      .populate("semester")
      .populate("assignedInstructor", "fullName email college department");

    res.status(200).json({
      success: true,
      message: "Subject archived successfully",
      subject: {
        id: populatedSubject._id,
        subjectCode: populatedSubject.subjectCode,
        subjectName: populatedSubject.subjectName,
        isArchived: populatedSubject.isArchived,
        archivedAt: populatedSubject.archivedAt,
        archivedBy: populatedSubject.archivedBy,
      },
    });
  } catch (error) {
    console.error("Archive subject error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Unarchive subject
export const unarchiveSubject = async (req, res) => {
  try {
    const { id } = req.params;

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    if (!subject.isArchived) {
      return res.status(400).json({
        success: false,
        message: "Subject is not archived",
      });
    }

    subject.isArchived = false;
    subject.archivedAt = null;
    subject.archivedBy = null;
    await subject.save();

    const populatedSubject = await Subject.findById(subject._id)
      .populate("semester")
      .populate("assignedInstructor", "fullName email college department");

    res.status(200).json({
      success: true,
      message: "Subject unarchived successfully",
      subject: {
        id: populatedSubject._id,
        subjectCode: populatedSubject.subjectCode,
        subjectName: populatedSubject.subjectName,
        isArchived: populatedSubject.isArchived,
      },
    });
  } catch (error) {
    console.error("Unarchive subject error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
