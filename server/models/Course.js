const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    required: [true, 'Course code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  courseName: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  // Academic Information
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: 1,
    max: 8
  },
  credits: {
    type: Number,
    required: [true, 'Credits are required'],
    min: 1,
    max: 10
  },
  
  // Course Type
  type: {
    type: String,
    enum: ['theory', 'practical', 'project', 'seminar'],
    default: 'theory'
  },
  
  // Prerequisites
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  
  // Faculty Information
  faculty: {
    coordinator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: true
    },
    instructors: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty'
    }]
  },
  
  // Class Schedule
  schedule: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    startTime: String,
    endTime: String,
    room: String,
    type: {
      type: String,
      enum: ['lecture', 'lab', 'tutorial']
    }
  }],
  
  // Syllabus
  syllabus: {
    units: [{
      unitNumber: Number,
      title: String,
      topics: [String],
      hours: Number
    }],
    textbooks: [{
      title: String,
      author: String,
      publisher: String,
      isbn: String
    }],
    references: [{
      title: String,
      author: String,
      publisher: String
    }]
  },
  
  // Assessment
  assessment: {
    internal: {
      percentage: {
        type: Number,
        default: 40
      },
      components: [{
        name: String,
        marks: Number,
        weightage: Number
      }]
    },
    external: {
      percentage: {
        type: Number,
        default: 60
      },
      examDuration: Number // in hours
    }
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  academicYear: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
courseSchema.index({ courseCode: 1 });
courseSchema.index({ department: 1, semester: 1 });
courseSchema.index({ isActive: 1 });

// Virtual to get enrolled students count
courseSchema.virtual('enrolledCount', {
  ref: 'Enrollment',
  localField: '_id',
  foreignField: 'course',
  count: true
});

module.exports = mongoose.model('Course', courseSchema);