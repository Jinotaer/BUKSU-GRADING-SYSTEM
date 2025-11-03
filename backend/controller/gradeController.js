// controllers/gradeController.js
import Grade from "../models/grades.js";
import Section from "../models/sections.js";
import { calculateAndUpdateGrade } from "../utils/gradeCalculator.js";

export const addOrUpdateGrade = async (req, res) => {
  try {
    const { studentId, sectionId, classStanding, laboratory, majorOutput } = req.body;
    const instructorId = req.instructor.id; // from instructorAuth middleware

    const section = await Section.findById(sectionId).populate("instructor");
    if (!section) return res.status(404).json({ message: "Section not found" });

    // Ensure the instructor owns the section
    if (String(section.instructor._id) !== String(instructorId)) {
      return res.status(403).json({ message: "Unauthorized to encode grades in this section" });
    }

    // Note: This endpoint allows manual grade entry, but real-time grades
    // are automatically calculated from activity scores via the gradeCalculator utility.
    // This is kept for backward compatibility or manual overrides.
    
    // Create or update grade
    let grade = await Grade.findOneAndUpdate(
      { student: studentId, section: sectionId },
      { classStanding, laboratory, majorOutput, encodedBy: instructorId },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Calculate final grade using section's grading schema
    if (classStanding !== undefined && laboratory !== undefined && majorOutput !== undefined) {
      const { classStanding: csWeight, laboratory: labWeight, majorOutput: moWeight } = section.gradingSchema;
      
      grade.finalGrade = (
        (classStanding * (csWeight / 100)) +
        (laboratory * (labWeight / 100)) +
        (majorOutput * (moWeight / 100))
      );
      
      // Determine remarks based on final grade (50% passing rate)
      if (grade.finalGrade >= 50) {
        grade.remarks = "Passed";
      } else if (grade.finalGrade < 50) {
        grade.remarks = "Failed";
      }
      
      await grade.save();
    }

    res.status(200).json({ success: true, grade });
  } catch (err) {
    console.error("addOrUpdateGrade:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getGradesBySection = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const grades = await Grade.find({ section: sectionId })
      .populate("student", "fullName studentId")
      .populate("section", "sectionName")
      .sort({ "student.fullName": 1 });

    res.json(grades);
  } catch (err) {
    console.error("getGradesBySection:", err);
    res.status(500).json({ message: "Server error" });
  }
};
