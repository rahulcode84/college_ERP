const mongoose = require('mongoose');

const borrowRecordSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  
  // Borrow Details
  borrowDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  returnDate: Date,
  
  // Status
  status: {
    type: String,
    enum: ['borrowed', 'returned', 'overdue', 'lost', 'damaged'],
    default: 'borrowed'
  },
  
  // Fine Information
  fine: {
    amount: {
      type: Number,
      default: 0,
      min: 0
    },
    reason: {
      type: String,
      enum: ['overdue', 'damage', 'lost']
    },
    paid: {
      type: Boolean,
      default: false
    },
    paidDate: Date
  },
  
  // Condition
  borrowCondition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good'
  },
  returnCondition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'damaged']
  },
  
  // Staff Information
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  returnedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Renewal Information
  renewalCount: {
    type: Number,
    default: 0,
    max: 2 // Maximum 2 renewals allowed
  },
  renewalHistory: [{
    renewedDate: Date,
    newDueDate: Date,
    renewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Remarks
  borrowRemarks: String,
  returnRemarks: String
}, {
  timestamps: true
});

// Indexes
borrowRecordSchema.index({ student: 1, borrowDate: -1 });
borrowRecordSchema.index({ book: 1, status: 1 });
borrowRecordSchema.index({ dueDate: 1, status: 1 });
borrowRecordSchema.index({ status: 1 });

// Auto-update overdue status
borrowRecordSchema.pre('save', function(next) {
  if (this.status === 'borrowed' && new Date() > this.dueDate) {
    this.status = 'overdue';
  }
  next();
});

module.exports = mongoose.model('BorrowRecord', borrowRecordSchema);