// models/Section.js
import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor", required: true },
  sectionName: { type: String, required: true }, // e.g., "BSCS 1A"
  schoolYear: { type: String, required: true },
  term: { type: String, required: true, enum: ["1st", "2nd"] },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }], // optional
  gradingSchema: {
    classStanding: { type: Number, default: 40 }, // percentages
    laboratory: { type: Number, default: 30 },
    majorOutput: { type: Number, default: 30 },
  },
  createdAt: { type: Date, default: Date.now },
});

sectionSchema.index({ subject: 1, instructor: 1, schoolYear: 1, term: 1 }, { unique: true });

// Check if model already exists before creating
let Section;
try {
  Section = mongoose.model("Section");
} catch (error) {
  Section = mongoose.model("Section", sectionSchema);
}

export default Section;
