const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Department name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Department code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [10, 'Department code cannot exceed 10 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  head: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Faculty member who is the head
  },
  established: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  contactInfo: {
    email: String,
    phone: String,
    office: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual to populate faculty count
departmentSchema.virtual('facultyCount', {
  ref: 'Faculty',
  localField: '_id',
  foreignField: 'department',
  count: true
});

// Virtual to populate student count
departmentSchema.virtual('studentCount', {
  ref: 'Student',
  localField: '_id',
  foreignField: 'department',
  count: true
});

departmentSchema.index({ code: 1 });
departmentSchema.index({ isActive: 1 });

module.exports = mongoose.model('Department', departmentSchema);


