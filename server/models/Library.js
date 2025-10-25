const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  // Book Information
  isbn: {
    type: String,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true
  },
  author: {
    type: [String],
    required: [true, 'Author is required']
  },
  publisher: {
    type: String,
    required: true
  },
  edition: {
    type: String
  },
  language: {
    type: String,
    default: 'English'
  },
  
  // Classification
  category: {
    type: String,
    required: true,
    enum: ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Mathematics', 
           'Physics', 'Chemistry', 'Literature', 'Management', 'Other']
  },
  subject: {
    type: String
  },
  keywords: [String],
  
  // Physical Details
  totalCopies: {
    type: Number,
    required: true,
    min: 1
  },
  availableCopies: {
    type: Number,
    required: true,
    min: 0
  },
  location: {
    shelf: String,
    rack: String,
    floor: String
  },
  
  // Publication Details
  publishedYear: {
    type: Number,
    min: 1900,
    max: new Date().getFullYear()
  },
  pages: {
    type: Number,
    min: 1
  },
  price: {
    type: Number,
    min: 0
  },
  
  // Status
  status: {
    type: String,
    enum: ['available', 'maintenance', 'lost', 'damaged'],
    default: 'available'
  },
  
  // Additional Information
  description: String,
  coverImage: String,
  
  // Acquisition
  acquisitionDate: {
    type: Date,
    default: Date.now
  },
  supplier: String,
  
  // Digital Copy
  digitalCopy: {
    isAvailable: {
      type: Boolean,
      default: false
    },
    url: String,
    format: String
  }
}, {
  timestamps: true
});

// Indexes
bookSchema.index({ title: 'text', author: 'text', subject: 'text' });
bookSchema.index({ isbn: 1 });
bookSchema.index({ category: 1 });
bookSchema.index({ status: 1 });

module.exports = mongoose.model('Book', bookSchema);