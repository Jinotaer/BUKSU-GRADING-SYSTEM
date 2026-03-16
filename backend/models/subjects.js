// models/Subject.js
import mongoose from "mongoose";

const SUBJECT_CODE_PATTERN = /^[A-Za-z0-9 -]+$/;

const isValidSubjectCode = (subjectCode) => {
  if (typeof subjectCode !== "string") {
    return false;
  }

  const normalizedSubjectCode = subjectCode.trim();
  return Boolean(normalizedSubjectCode) && SUBJECT_CODE_PATTERN.test(normalizedSubjectCode);
};

const subjectSchema = new mongoose.Schema({
  subjectCode: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: isValidSubjectCode,
      message:
        "Subject Code can only contain alphanumeric characters, spaces, or hyphens.",
    },
  },
  subjectName: { type: String, required: true },
  units: { type: Number, required: true },
  college: { type: String, required: true },
  department: { type: String, required: true },
  semester: { type: mongoose.Schema.Types.ObjectId, ref: "Semester", required: true },
  assignedInstructor: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor", default: null },
  createdAt: { type: Date, default: Date.now },
  isArchived: { type: Boolean, default: false },
  archivedAt: { type: Date, default: null },
  archivedBy: { type: String, default: null }, // admin email or ID
});

subjectSchema.index({ subjectCode: 1, semester: 1 }, { unique: true });

// Check if model already exists before creating
let Subject;
try {
  Subject = mongoose.model("Subject");
} catch (error) {
  Subject = mongoose.model("Subject", subjectSchema);
}

export default Subject;
