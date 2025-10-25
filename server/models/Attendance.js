const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  period: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    required: true
  },
  timeIn: Date,
  timeOut: Date,
  remarks: String,
  
  // Class Information
  classType: {
    type: String,
    enum: ['lecture', 'lab', 'tutorial', 'seminar'],
    default: 'lecture'
  },
  topic: String,
  
  // Marking Information
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  markedAt: {
    type: Date,
    default: Date.now
  },
  
  // Academic Period
  academicYear: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Compound index for unique attendance per student per course per date per period
attendanceSchema.index({ 
  student: 1, 
  course: 1, 
  date: 1, 
  period: 1 
}, { unique: true });

// Indexes for queries
attendanceSchema.index({ student: 1, date: -1 });
attendanceSchema.index({ course: 1, date: -1 });
attendanceSchema.index({ faculty: 1, date: -1 });
attendanceSchema.index({ academicYear: 1, semester: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
