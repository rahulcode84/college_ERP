const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
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
  academicYear: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['enrolled', 'completed', 'dropped', 'failed'],
    default: 'enrolled'
  },
  
  // Grades
  grades: {
    internal: {
      assignments: [{
        name: String,
        maxMarks: Number,
        obtainedMarks: Number,
        submissionDate: Date
      }],
      tests: [{
        name: String,
        maxMarks: Number,
        obtainedMarks: Number,
        testDate: Date
      }],
      totalInternal: Number
    },
    external: {
      examMarks: Number,
      maxMarks: Number
    },
    totalMarks: Number,
    grade: {
      type: String,
      enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']
    },
    gradePoints: Number
  }
}, {
  timestamps: true
});

// Compound index to ensure unique enrollment per student per course per academic year
enrollmentSchema.index({ student: 1, course: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);