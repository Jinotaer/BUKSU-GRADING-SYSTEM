import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  eventType: {
    type: String,
    enum: ['quiz', 'laboratory', 'exam', 'assignment', 'project', 'other'],
    required: true
  },
  startDateTime: {
    type: Date,
    required: true
  },
  endDateTime: {
    type: Date,
    required: true
  },
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Instructor',
    required: true
  },
  activity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    default: null
  },
  googleEventId: {
    type: String,
    default: null
  },
  isGoogleCalendarSynced: {
    type: Boolean,
    default: false
  },
  location: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
scheduleSchema.index({ instructor: 1, startDateTime: 1 });
scheduleSchema.index({ section: 1, startDateTime: 1 });
scheduleSchema.index({ startDateTime: 1, endDateTime: 1 });

const Schedule = mongoose.model('Schedule', scheduleSchema);

export default Schedule;
