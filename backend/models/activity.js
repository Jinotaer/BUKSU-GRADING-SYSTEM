// models/activity.js
import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      required: true,
      enum: ["classStanding", "laboratory", "majorOutput"]
    },
    maxScore: {
      type: Number,
      required: true,
      min: 1
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Instructor",
      required: false
    },
    semester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
      required: true
    },
    schoolYear: {
      type: String,
      required: true
    },
    term: {
      type: String,
      required: true,
      enum: ["First", "Second", "Summer"]
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
activitySchema.index({ subject: 1, instructor: 1 });
activitySchema.index({ semester: 1, schoolYear: 1, term: 1 });

const Activity = mongoose.model("Activity", activitySchema);

export default Activity;