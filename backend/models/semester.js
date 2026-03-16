// models/Semester.js
import mongoose from "mongoose";

const SCHOOL_YEAR_PATTERN = /^(\d{4})-(\d{4})$/;

const isValidSchoolYear = (schoolYear) => {
  if (typeof schoolYear !== "string") {
    return false;
  }

  const match = schoolYear.trim().match(SCHOOL_YEAR_PATTERN);
  if (!match) {
    return false;
  }

  return Number(match[2]) === Number(match[1]) + 1;
};

const semesterSchema = new mongoose.Schema({
  schoolYear: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: isValidSchoolYear,
      message:
        'schoolYear must use the "YYYY-YYYY" format with consecutive years.',
    },
  }, // e.g. "2025-2026"
  term: { type: String, required: true, enum: ["1st", "2nd", "Summer"] },
  createdAt: { type: Date, default: Date.now },
  isArchived: { type: Boolean, default: false },
  archivedAt: { type: Date, default: null },
  archivedBy: { type: String, default: null }, // admin email or ID
});

semesterSchema.index({ schoolYear: 1, term: 1 }, { unique: true });

// Check if model already exists before creating
let Semester;
try {
  Semester = mongoose.model("Semester");
} catch (error) {
  Semester = mongoose.model("Semester", semesterSchema);
}

export default Semester;
