const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // User Information
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userRole: {
    type: String,
    required: true
  },
  
  // Action Information
  action: {
    type: String,
    required: true,
    enum: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'ROLE_CHANGE']
  },
  resource: {
    type: String,
    required: true // e.g., 'User', 'Student', 'Fee', etc.
  },
  resourceId: {
    type: String // ID of the affected resource
  },
  
  // Details
  description: {
    type: String,
    required: true
  },
  details: {
    before: mongoose.Schema.Types.Mixed, // Previous state
    after: mongoose.Schema.Types.Mixed,  // New state
    changes: [String] // Array of changed fields
  },
  
  // Request Information
  ipAddress: String,
  userAgent: String,
  requestMethod: String,
  requestUrl: String,
  
  // Status
  status: {
    type: String,
    enum: ['success', 'failure', 'error'],
    default: 'success'
  },
  errorMessage: String,
  
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false // We're using custom timestamp
});

// Indexes for efficient querying
auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

// TTL index to automatically delete old logs (keep for 2 years)
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 }); // 2 years in seconds

module.exports = mongoose.model('AuditLog', auditLogSchema);