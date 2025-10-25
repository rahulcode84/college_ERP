const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  // Reference to User model
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Faculty Specific Information
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
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
  designation: {
    type: String,
    required: [true, 'Designation is required'],
    enum: ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Lab Assistant', 'HOD']
  },
  joiningDate: {
    type: Date,
    required: [true, 'Joining date is required']
  },
  
  // Qualifications
  qualifications: [{
    degree: {
      type: String,
      required: true
    },
    institution: String,
    year: Number,
    specialization: String
  }],
  
  // Experience
  experience: {
    total: {
      type: Number,
      default: 0 // in years
    },
    previous: [{
      organization: String,
      position: String,
      duration: String,
      from: Date,
      to: Date
    }]
  },
  
  // Subjects Teaching
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  
  // Class Coordinator
  classCoordinator: [{
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department'
    },
    semester: Number,
    batch: String
  }],
  
  // Office Information
  office: {
    roomNumber: String,
    building: String,
    phone: String,
    officeHours: String
  },
  
  // Salary Information
  salary: {
    basic: Number,
    allowances: Number,
    total: Number
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'on_leave', 'retired'],
    default: 'active'
  },
  
  // Research & Publications
  research: {
    areaOfInterest: [String],
    publications: [{
      title: String,
      journal: String,
      year: Number,
      url: String
    }],
    projects: [{
      title: String,
      fundingAgency: String,
      amount: Number,
      duration: String,
      status: {
        type: String,
        enum: ['ongoing', 'completed', 'proposed']
      }
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
facultySchema.index({ employeeId: 1 });
facultySchema.index({ department: 1 });
facultySchema.index({ designation: 1 });
facultySchema.index({ status: 1 });

module.exports = mongoose.model('Faculty', facultySchema);