// models/Grade.js
import mongoose from "mongoose";

const gradeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  section: { type: mongoose.Schema.Types.ObjectId, ref: "Section", required: true },
  
  // Term grades (Midterm 40%, Final Term 60%)
  midtermGrade: { type: Number, default: 0 },
  finalTermGrade: { type: Number, default: 0 },
  
  // Midterm component averages
  midtermClassStanding: { type: Number, default: 0 },
  midtermLaboratory: { type: Number, default: 0 },
  midtermMajorOutput: { type: Number, default: 0 },
  
  // Final term component averages
  finalClassStanding: { type: Number, default: 0 },
  finalLaboratory: { type: Number, default: 0 },
  finalMajorOutput: { type: Number, default: 0 },
  
  // Overall component averages (for compatibility)
  classStanding: { type: Number, default: 0 },
  laboratory: { type: Number, default: 0 },
  majorOutput: { type: Number, default: 0 },

  // Final computed grade
  finalGrade: { type: Number, default: 0 },
  
  // Subject characteristics
  hasLaboratory: { type: Boolean, default: false },

  // Remarks based on grading rules
  remarks: { 
    type: String, 
    enum: ["Passed", "Failed", "INC", "DRP"], 
    default: "INC" 
  },

  // Optional meta info
  encodedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor" },
  dateRecorded: { type: Date, default: Date.now },
});

// Prevent duplicate grade entries per student per section
gradeSchema.index({ student: 1, section: 1 }, { unique: true });

// Automatically compute finalGrade before saving
gradeSchema.pre("save", async function (next) {
  try {
    const section = await mongoose.model("Section").findById(this.section).lean();
    if (section && section.gradingSchema) {
      const { classStanding, laboratory, majorOutput } = section.gradingSchema;

      // Compute weighted final grade
      this.finalGrade = (
        (this.classStanding * (classStanding / 100)) +
        (this.laboratory * (laboratory / 100)) +
        (this.majorOutput * (majorOutput / 100))
      ).toFixed(2);

      // Automatically set remarks based on passing criteria
      this.remarks = this.finalGrade >= 75 ? "Passed" : "Failed";
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Check if model already exists before creating
let Grade;
try {
  Grade = mongoose.model("Grade");
} catch (error) {
  Grade = mongoose.model("Grade", gradeSchema);
}

export default Grade;
