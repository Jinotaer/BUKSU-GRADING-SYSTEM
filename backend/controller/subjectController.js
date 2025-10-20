// controllers/subjectController.js
import Subject from "../models/subjects.js";
import Semester from "../models/semester.js";
import Instructor from "../models/instructor.js";
import emailService from "../services/emailService.js";

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
    const subjects = await Subject.find()
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

    if (!subjectCode || !subjectName || !units || !college || !department || !semester) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const semesterExists = await Semester.findById(semester);
    if (!semesterExists) return res.status(404).json({ message: "Semester not found" });

    // Check if instructor exists (if provided)
    if (instructorId) {
      const instructor = await Instructor.findById(instructorId);
      if (!instructor) return res.status(404).json({ message: "Instructor not found" });
    }

    // Check if another subject exists with the same subjectCode and semester
    const exists = await Subject.findOne({ 
      subjectCode, 
      semester, 
      _id: { $ne: id } 
    });
    
    if (exists) {
      return res.status(400).json({ message: "Subject code already exists for this semester" });
    }

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

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    res.json({ success: true, subject });
  } catch (err) {
    console.error("updateSubject:", err);
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
