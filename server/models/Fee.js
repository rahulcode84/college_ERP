const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  
  // Fee Structure
  feeType: {
    type: String,
    enum: ['tuition', 'hostel', 'transport', 'library', 'lab', 'examination', 'sports', 'other'],
    required: true
  },
  
  // Academic Period
  academicYear: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  
  // Amount Details
  amount: {
    total: {
      type: Number,
      required: true,
      min: 0
    },
    paid: {
      type: Number,
      default: 0,
      min: 0
    },
    due: {
      type: Number,
      default: function() {
        return this.amount.total - this.amount.paid;
      }
    },
    fine: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // Payment Status
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue'],
    default: 'pending'
  },
  
  // Due Date
  dueDate: {
    type: Date,
    required: true
  },
  
  // Payment History
  payments: [{
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'cheque', 'online', 'card', 'upi'],
      required: true
    },
    transactionId: String,
    receiptNumber: String,
    remarks: String,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Concessions/Scholarships
  concession: {
    type: {
      type: String,
      enum: ['scholarship', 'merit', 'need_based', 'sports', 'other']
    },
    amount: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    remarks: String
  }
}, {
  timestamps: true
});

// Indexes
feeSchema.index({ student: 1, academicYear: 1, semester: 1 });
feeSchema.index({ status: 1 });
feeSchema.index({ dueDate: 1 });
feeSchema.index({ feeType: 1 });

// Calculate due amount before saving
feeSchema.pre('save', function(next) {
  this.amount.due = this.amount.total - this.amount.paid;
  
  // Update status based on payment
  if (this.amount.paid === 0) {
    this.status = new Date() > this.dueDate ? 'overdue' : 'pending';
  } else if (this.amount.paid < this.amount.total) {
    this.status = 'partial';
  } else {
    this.status = 'paid';
  }
  
  next();
});

module.exports = mongoose.model('Fee', feeSchema);