const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  // Reference to User model
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Student Specific Information
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  rollNumber: {
    type: String,
    required: [true, 'Roll number is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  
  // Academic Information
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  batch: {
    type: String,
    required: [true, 'Batch is required']
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: 1,
    max: 8
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required']
  },
  admissionDate: {
    type: Date,
    required: [true, 'Admission date is required']
  },
  
  // Parent/Guardian Information
  guardian: {
    father: {
      name: String,
      occupation: String,
      phone: String,
      email: String
    },
    mother: {
      name: String,
      occupation: String,
      phone: String,
      email: String
    },
    guardian: {
      name: String,
      relationship: String,
      phone: String,
      email: String
    }
  },
  
  // Academic Performance
  cgpa: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  totalCredits: {
    type: Number,
    default: 0
  },
  
  // Documents
  documents: [{
    type: {
      type: String,
      enum: ['id_proof', 'address_proof', 'academic_certificate', 'medical_certificate', 'other'],
      required: true
    },
    name: String,
    url: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'graduated', 'dropped', 'suspended'],
    default: 'active'
  },
  
  // Library Information
  libraryCard: {
    cardNumber: String,
    issueDate: Date,
    expiryDate: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
studentSchema.index({ studentId: 1 });
studentSchema.index({ rollNumber: 1 });
studentSchema.index({ department: 1 });
studentSchema.index({ batch: 1 });
studentSchema.index({ semester: 1 });
studentSchema.index({ status: 1 });

// Virtual to get attendance percentage
studentSchema.virtual('attendancePercentage', {
  ref: 'Attendance',
  localField: '_id',
  foreignField: 'student',
  count: true
});

module.exports = mongoose.model('Student', studentSchema);