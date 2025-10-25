const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  // Academic Information
  academicYear: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  batch: {
    type: String,
    required: true
  },
  
  // Schedule
  schedule: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true
    },
    periods: [{
      periodNumber: {
        type: Number,
        required: true,
        min: 1,
        max: 8
      },
      startTime: {
        type: String,
        required: true
      },
      endTime: {
        type: String,
        required: true
      },
      course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
      },
      faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty'
      },
      room: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['lecture', 'lab', 'tutorial', 'break'],
        default: 'lecture'
      },
      isBreak: {
        type: Boolean,
        default: false
      }
    }]
  }],
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Version Control
  version: {
    type: Number,
    default: 1
  },
  effectiveFrom: {
    type: Date,
    required: true
  },
  effectiveTo: Date,
  
  // Created By
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Approval
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  
  remarks: String
}, {
  timestamps: true
});

// Compound index for unique timetable per department per semester per batch per academic year
timetableSchema.index({ 
  academicYear: 1, 
  semester: 1, 
  department: 1, 
  batch: 1,
  version: 1 
}, { unique: true });

module.exports = mongoose.model('Timetable', timetableSchema);