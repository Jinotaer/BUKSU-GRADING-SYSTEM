// models/Section.js
import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor", required: true },
  sectionName: { type: String, required: true }, // e.g., "BSCS 1A"
  sectionCode: { type: String, default: '' }, // e.g., "BSCS-1A"
  schoolYear: { type: String, required: true },
  term: { type: String, required: true, enum: ["1st", "2nd", "Summer"] },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }], // optional
  gradingSchema: {
    classStanding: { type: Number, default: 0 }, // percentages
    laboratory: { type: Number, default: 0 },
    majorOutput: { type: Number, default: 0 },
  },
  schedule: {
    day: { type: String, default: '' },
    time: { type: String, default: '' },
    room: { type: String, default: '' },
  },
  chairperson: { type: String, default: '' },
  dean: { type: String, default: '' },
  exportMetadata: {
    spreadsheetId: { type: String, default: null },
    sheetId: { type: Number, default: null },
    sheetTitle: { type: String, default: null },
    usedFallbackHub: { type: Boolean, default: false },
    spreadsheetTitle: { type: String, default: null },
    spreadsheetUrl: { type: String, default: null },
    lastExportedAt: { type: Date, default: null },
  },
  createdAt: { type: Date, default: Date.now },
  isArchived: { type: Boolean, default: false },
  archivedAt: { type: Date, default: null },
  archivedBy: { type: String, default: null }, // admin email or ID
  archivedByStudents: [{ 
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    archivedAt: { type: Date, default: Date.now }
  }], // Students who have archived this section
  hiddenByStudents: [{ 
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    hiddenAt: { type: Date, default: Date.now }
  }], // Students who have hidden this section
});

sectionSchema.index({ subject: 1, instructor: 1, schoolYear: 1, term: 1, sectionName: 1 }, { unique: true });

// Check if model already exists before creating
let Section;
try {
  Section = mongoose.model("Section");
} catch (error) {
  Section = mongoose.model("Section", sectionSchema);
}

export default Section;
