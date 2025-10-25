const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Notice title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Notice content is required']
  },
  
  // Target Audience
  targetAudience: {
    type: [String],
    enum: ['all', 'students', 'faculty', 'admin', 'staff'],
    default: ['all']
  },
  
  // Specific Targeting
  targetDepartments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  }],
  targetSemesters: [Number],
  targetBatches: [String],
  
  // Priority and Category
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['academic', 'administrative', 'event', 'examination', 'holiday', 'emergency', 'general'],
    required: true
  },
  
  // Attachments
  attachments: [{
    name: String,
    url: String,
    size: Number,
    type: String
  }],
  
  // Publishing Details
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  publishDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: Date,
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'expired'],
    default: 'draft'
  },
  
  // Interaction
  views: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Display Options
  isPinned: {
    type: Boolean,
    default: false
  },
  isEmergency: {
    type: Boolean,
    default: false
  },
  
  // Notification Settings
  sendNotification: {
    type: Boolean,
    default: false
  },
  sendEmail: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
noticeSchema.index({ publishDate: -1 });
noticeSchema.index({ status: 1, priority: 1 });
noticeSchema.index({ category: 1 });
noticeSchema.index({ targetAudience: 1 });
noticeSchema.index({ expiryDate: 1 });

// Auto-expire notices
noticeSchema.pre('save', function(next) {
  if (this.expiryDate && new Date() > this.expiryDate && this.status === 'published') {
    this.status = 'expired';
  }
  next();
});

module.exports = mongoose.model('Notice', noticeSchema);