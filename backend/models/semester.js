// models/Semester.js
import mongoose from "mongoose";

const semesterSchema = new mongoose.Schema({
  schoolYear: { type: String, required: true }, // e.g. "2025-2026"
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
