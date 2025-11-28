// models/activityScore.js
import mongoose from "mongoose";
const ActivityScoreSchema = new mongoose.Schema({
  activity: { type: mongoose.Schema.Types.ObjectId, ref: "Activity", index: true },
  section:  { type: mongoose.Schema.Types.ObjectId, ref: "Section", index: true },
  subject:  { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
  student:  { type: mongoose.Schema.Types.ObjectId, ref: "Student", index: true },
  score:    { type: Number },
  maxScore: { type: Number},
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor" },
  gradedAt: { type: Date },
}, { timestamps: true });

ActivityScoreSchema.index({ activity:1, section:1, student:1 }, { unique: true });
export default mongoose.model("ActivityScore", ActivityScoreSchema);
