// controllers/semesterController.js
import Semester from "../models/semester.js";
import Section from "../models/sections.js";
import Subject from "../models/subjects.js";
import Activity from "../models/activity.js";
import { calculateAndUpdateAllGradesInSection } from "../utils/gradeCalculator.js";

export const addSemester = async (req, res) => {
  try {
    const { schoolYear, term } = req.body;
    if (!schoolYear || !term) return res.status(400).json({ message: "schoolYear and term are required" });

    const exists = await Semester.findOne({ schoolYear, term });
    if (exists) return res.status(400).json({ message: "Semester already exists" });

    const semester = await Semester.create({ schoolYear, term });
    return res.status(201).json({ success: true, semester });
  } catch (err) {
    console.error("addSemester:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const listSemesters = async (req, res) => {
  try {
    const { includeArchived = false } = req.query;
    
    const filter = {};
    if (includeArchived !== 'true') {
      filter.isArchived = { $ne: true };
    }
    
    const semesters = await Semester.find(filter).sort({ schoolYear: -1, term: 1 });
    res.json({ success: true, semesters });
  } catch (err) {
    console.error("listSemesters:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateSemester = async (req, res) => {
  try {
    const { id } = req.params;
    const { schoolYear, term } = req.body;

    if (!schoolYear || !term) {
      return res.status(400).json({ message: "schoolYear and term are required" });
    }

    // Check if another semester exists with the same schoolYear and term
    const exists = await Semester.findOne({ 
      schoolYear, 
      term, 
      _id: { $ne: id } 
    });
    
    if (exists) {
      return res.status(400).json({ message: "Semester already exists" });
    }

    // Get the old semester data before updating
    const oldSemester = await Semester.findById(id);
    if (!oldSemester) {
      return res.status(404).json({ message: "Semester not found" });
    }

    // Update the semester
    const semester = await Semester.findByIdAndUpdate(
      id,
      { schoolYear, term },
      { new: true, runValidators: true }
    );

    // If schoolYear or term changed, update all sections linked to subjects with this semester
    if (oldSemester.schoolYear !== schoolYear || oldSemester.term !== term) {
      // Find all subjects that reference this semester
      const subjects = await Subject.find({ semester: id });
      const subjectIds = subjects.map(s => s._id);

      if (subjectIds.length > 0) {
        // Update all sections that belong to these subjects
        const sectionUpdateResult = await Section.updateMany(
          { subject: { $in: subjectIds } },
          { 
            $set: { 
              schoolYear: schoolYear,
              term: term
            }
          }
        );

        console.log(`Updated ${sectionUpdateResult.modifiedCount} sections to match new semester (${schoolYear}, ${term})`);

        // Update all activities that belong to these subjects
        const activityUpdateResult = await Activity.updateMany(
          { subject: { $in: subjectIds }, semester: id },
          { 
            $set: { 
              schoolYear: schoolYear,
              term: term === "1st" ? "Midterm" : term === "2nd" ? "Finalterm" : "Summer"
            }
          }
        );

        console.log(`Updated ${activityUpdateResult.modifiedCount} activities to match new semester (${schoolYear}, ${term})`);

        // Recalculate grades for all affected sections
        const affectedSections = await Section.find({ subject: { $in: subjectIds } });
        for (const section of affectedSections) {
          try {
            await calculateAndUpdateAllGradesInSection(section._id);
            console.log(`Recalculated grades for section ${section._id}`);
          } catch (gradeError) {
            console.error(`Error recalculating grades for section ${section._id}:`, gradeError);
          }
        }
      }
    }

    res.json({ success: true, semester });
  } catch (err) {
    console.error("updateSemester:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteSemester = async (req, res) => {
  try {
    const { id } = req.params;

    const semester = await Semester.findByIdAndDelete(id);
    
    if (!semester) {
      return res.status(404).json({ message: "Semester not found" });
    }

    res.json({ success: true, message: "Semester deleted successfully" });
  } catch (err) {
    console.error("deleteSemester:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Archive semester
export const archiveSemester = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.admin.email;

    const semester = await Semester.findById(id);
    if (!semester) {
      return res.status(404).json({
        success: false,
        message: "Semester not found",
      });
    }

    if (semester.isArchived) {
      return res.status(400).json({
        success: false,
        message: "Semester is already archived",
      });
    }

    semester.isArchived = true;
    semester.archivedAt = new Date();
    semester.archivedBy = adminEmail;
    await semester.save();

    res.status(200).json({
      success: true,
      message: "Semester archived successfully",
      semester: {
        id: semester._id,
        schoolYear: semester.schoolYear,
        term: semester.term,
        isArchived: semester.isArchived,
        archivedAt: semester.archivedAt,
        archivedBy: semester.archivedBy,
      },
    });
  } catch (error) {
    console.error("Archive semester error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Unarchive semester
export const unarchiveSemester = async (req, res) => {
  try {
    const { id } = req.params;

    const semester = await Semester.findById(id);
    if (!semester) {
      return res.status(404).json({
        success: false,
        message: "Semester not found",
      });
    }

    if (!semester.isArchived) {
      return res.status(400).json({
        success: false,
        message: "Semester is not archived",
      });
    }

    semester.isArchived = false;
    semester.archivedAt = null;
    semester.archivedBy = null;
    await semester.save();

    res.status(200).json({
      success: true,
      message: "Semester unarchived successfully",
      semester: {
        id: semester._id,
        schoolYear: semester.schoolYear,
        term: semester.term,
        isArchived: semester.isArchived,
      },
    });
  } catch (error) {
    console.error("Unarchive semester error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
