// server/controllers/libraryController.js

const asyncHandler = require('../utils/asyncHandler');
const { Library: Book, BorrowRecord, Student, AuditLog } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const logger = require('../utils/logger');

// @desc    Get books catalog with search and filtering
// @route   GET /api/library/books
// @access  Private (All authenticated users)
const getBooks = asyncHandler(async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      search, 
      category, 
      author, 
      availability,
      sortBy = 'title',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } },
        { publisher: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category && category !== 'all') query.category = category;
    if (author && author !== 'all') query.author = { $regex: author, $options: 'i' };
    
    if (availability) {
      if (availability === 'available') {
        query.availableCopies = { $gt: 0 };
      } else if (availability === 'unavailable') {
        query.availableCopies = { $lte: 0 };
      }
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const books = await Book.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Book.countDocuments(query);

    // Get categories for filter options
    const categories = await Book.distinct('category');
    const authors = await Book.distinct('author');

    // Add borrowing status for each book if user is student
    let booksWithStatus = books;
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user.id });
      if (student) {
        booksWithStatus = await Promise.all(books.map(async (book) => {
          const borrowRecord = await BorrowRecord.findOne({
            student: student._id,
            book: book._id,
            status: 'borrowed'
          });
          
          return {
            ...book.toObject(),
            userBorrowStatus: borrowRecord ? 'borrowed' : 'not_borrowed'
          };
        }));
      }
    }

    const bookData = {
      books: booksWithStatus,
      filters: {
        categories: categories,
        authors: authors.slice(0, 20) // Limit authors for dropdown
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalBooks: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };

    logger.info(`Books catalog fetched by user: ${req.user.id}`);
    return successResponse(res, 'Books retrieved successfully', bookData);

  } catch (error) {
    logger.error('Error fetching books:', error);
    return errorResponse(res, 'Failed to fetch books', 500);
  }
});

// @desc    Get single book details
// @route   GET /api/library/books/:bookId
// @access  Private (All authenticated users)
const getBookDetails = asyncHandler(async (req, res) => {
  try {
    const { bookId } = req.params;

    const book = await Book.findById(bookId);
    if (!book) {
      return errorResponse(res, 'Book not found', 404);
    }

    // Get borrowing history (for admin/librarian)
    let borrowHistory = [];
    if (req.user.role === 'admin' || req.user.role === 'librarian') {
      borrowHistory = await BorrowRecord.find({ book: bookId })
        .populate('student', 'rollNumber studentId user')
        .populate('student.user', 'firstName lastName')
        .sort({ borrowDate: -1 })
        .limit(10);
    }

    // Check if current user has borrowed this book
    let userBorrowRecord = null;
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user.id });
      if (student) {
        userBorrowRecord = await BorrowRecord.findOne({
          student: student._id,
          book: bookId,
          status: 'borrowed'
        });
      }
    }

    // Get similar books (same category)
    const similarBooks = await Book.find({
      category: book.category,
      _id: { $ne: bookId },
      availableCopies: { $gt: 0 }
    }).limit(5);

    const bookDetails = {
      book: book,
      borrowHistory: borrowHistory,
      userBorrowRecord: userBorrowRecord,
      similarBooks: similarBooks,
      availability: {
        isAvailable: book.availableCopies > 0,
        totalCopies: book.totalCopies,
        availableCopies: book.availableCopies,
        borrowedCopies: book.totalCopies - book.availableCopies
      }
    };

    logger.info(`Book details fetched by user: ${req.user.id}, book: ${bookId}`);
    return successResponse(res, 'Book details retrieved successfully', bookDetails);

  } catch (error) {
    logger.error('Error fetching book details:', error);
    return errorResponse(res, 'Failed to fetch book details', 500);
  }
});

// @desc    Borrow a book
// @route   POST /api/library/borrow
// @access  Private (Student)
const borrowBook = asyncHandler(async (req, res) => {
  try {
    const { bookId } = req.body;

    // Only students can borrow books
    if (req.user.role !== 'student') {
      return errorResponse(res, 'Only students can borrow books', 403);
    }

    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return errorResponse(res, 'Student profile not found', 404);
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return errorResponse(res, 'Book not found', 404);
    }

    // Check if book is available
    if (book.availableCopies <= 0) {
      return errorResponse(res, 'Book is not available for borrowing', 400);
    }

    // Check if student has already borrowed this book
    const existingBorrow = await BorrowRecord.findOne({
      student: student._id,
      book: bookId,
      status: 'borrowed'
    });

    if (existingBorrow) {
      return errorResponse(res, 'You have already borrowed this book', 400);
    }

    // Check borrowing limits
    const currentBorrows = await BorrowRecord.countDocuments({
      student: student._id,
      status: 'borrowed'
    });

    const maxBooksAllowed = 5; // This could be configurable
    if (currentBorrows >= maxBooksAllowed) {
      return errorResponse(res, `You can only borrow a maximum of ${maxBooksAllowed} books`, 400);
    }

    // Check for overdue books
    const currentDate = new Date();
    const overdueBooks = await BorrowRecord.countDocuments({
      student: student._id,
      status: 'borrowed',
      dueDate: { $lt: currentDate }
    });

    if (overdueBooks > 0) {
      return errorResponse(res, 'You have overdue books. Please return them before borrowing new books', 400);
    }

    // Calculate due date (14 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    // Create borrow record
    const borrowRecord = new BorrowRecord({
      student: student._id,
      book: bookId,
      borrowDate: new Date(),
      dueDate: dueDate,
      status: 'borrowed',
      issuedBy: req.user.id
    });

    await borrowRecord.save();

    // Update book availability
    book.availableCopies -= 1;
    await book.save();

    // Log the action
    const auditLog = new AuditLog({
      user: req.user.id,
      action: 'BORROW_BOOK',
      resource: 'BorrowRecord',
      resourceId: borrowRecord._id,
      details: `Student ${student.rollNumber} borrowed book: ${book.title}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await auditLog.save();

    const borrowData = {
      borrowRecord: borrowRecord,
      book: {
        title: book.title,
        author: book.author,
        isbn: book.isbn
      },
      dueDate: dueDate,
      renewalsAllowed: 2 // This could be configurable
    };

    logger.info(`Book borrowed by student: ${req.user.id}, book: ${bookId}`);
    return successResponse(res, 'Book borrowed successfully', borrowData);

  } catch (error) {
    logger.error('Error borrowing book:', error);
    return errorResponse(res, 'Failed to borrow book', 500);
  }
});

// @desc    Return a book
// @route   POST /api/library/return
// @access  Private (Student, Admin, Librarian)
const returnBook = asyncHandler(async (req, res) => {
  try {
    const { borrowRecordId, condition, notes } = req.body;

    const borrowRecord = await BorrowRecord.findById(borrowRecordId)
      .populate('book', 'title author availableCopies totalCopies')
      .populate('student', 'rollNumber user')
      .populate('student.user', 'firstName lastName');

    if (!borrowRecord) {
      return errorResponse(res, 'Borrow record not found', 404);
    }

    if (borrowRecord.status !== 'borrowed') {
      return errorResponse(res, 'Book has already been returned', 400);
    }

    // Check permission - students can only return their own books
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user.id });
      if (!student || !borrowRecord.student._id.equals(student._id)) {
        return errorResponse(res, 'You can only return your own books', 403);
      }
    }

    // Calculate if book is overdue
    const currentDate = new Date();
    const isOverdue = currentDate > borrowRecord.dueDate;
    const daysOverdue = isOverdue ? 
      Math.ceil((currentDate - borrowRecord.dueDate) / (1000 * 60 * 60 * 24)) : 0;

    // Update borrow record
    borrowRecord.status = 'returned';
    borrowRecord.returnDate = currentDate;
    borrowRecord.condition = condition || 'good';
    borrowRecord.returnNotes = notes;
    borrowRecord.isOverdue = isOverdue;
    borrowRecord.daysOverdue = daysOverdue;
    borrowRecord.returnProcessedBy = req.user.id;

    await borrowRecord.save();

    // Update book availability
    const book = await Book.findById(borrowRecord.book._id);
    book.availableCopies += 1;
    await book.save();

    // Calculate fine if overdue
    let fine = 0;
    if (isOverdue) {
      const finePerDay = 2; // This could be configurable
      fine = daysOverdue * finePerDay;
      
      // Create fine record (this would integrate with fee system)
      // For now, just include in response
    }

    // Log the action
    const auditLog = new AuditLog({
      user: req.user.id,
      action: 'RETURN_BOOK',
      resource: 'BorrowRecord',
      resourceId: borrowRecordId,
      details: `Book returned: ${book.title} by student ${borrowRecord.student.rollNumber}${isOverdue ? ` (${daysOverdue} days overdue)` : ''}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await auditLog.save();

    const returnData = {
      borrowRecord: borrowRecord,
      book: borrowRecord.book,
      returnDetails: {
        returnDate: currentDate,
        isOverdue: isOverdue,
        daysOverdue: daysOverdue,
        fine: fine,
        condition: condition || 'good'
      }
    };

    logger.info(`Book returned by user: ${req.user.id}, record: ${borrowRecordId}`);
    return successResponse(res, 'Book returned successfully', returnData);

  } catch (error) {
    logger.error('Error returning book:', error);
    return errorResponse(res, 'Failed to return book', 500);
  }
});

// @desc    Renew a book
// @route   POST /api/library/renew
// @access  Private (Student)
const renewBook = asyncHandler(async (req, res) => {
  try {
    const { borrowRecordId } = req.body;

    // Only students can renew books
    if (req.user.role !== 'student') {
      return errorResponse(res, 'Only students can renew books', 403);
    }

    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return errorResponse(res, 'Student profile not found', 404);
    }

    const borrowRecord = await BorrowRecord.findById(borrowRecordId)
      .populate('book', 'title author');

    if (!borrowRecord) {
      return errorResponse(res, 'Borrow record not found', 404);
    }

    if (!borrowRecord.student.equals(student._id)) {
      return errorResponse(res, 'You can only renew your own books', 403);
    }

    if (borrowRecord.status !== 'borrowed') {
      return errorResponse(res, 'Only borrowed books can be renewed', 400);
    }

    // Check renewal limits
    const maxRenewals = 2; // This could be configurable
    if (borrowRecord.renewalCount >= maxRenewals) {
      return errorResponse(res, `Maximum renewal limit (${maxRenewals}) reached`, 400);
    }

    // Check if book is overdue
    const currentDate = new Date();
    if (currentDate > borrowRecord.dueDate) {
      return errorResponse(res, 'Overdue books cannot be renewed', 400);
    }

    // Check for holds/reservations on this book
    const hasHolds = await BorrowRecord.countDocuments({
      book: borrowRecord.book._id,
      status: 'reserved'
    });

    if (hasHolds > 0) {
      return errorResponse(res, 'Book cannot be renewed as it has pending reservations', 400);
    }

    // Renew the book (extend due date by 14 days)
    const newDueDate = new Date(borrowRecord.dueDate);
    newDueDate.setDate(newDueDate.getDate() + 14);

    borrowRecord.dueDate = newDueDate;
    borrowRecord.renewalCount += 1;
    borrowRecord.lastRenewalDate = currentDate;

    await borrowRecord.save();

    // Log the action
    const auditLog = new AuditLog({
      user: req.user.id,
      action: 'RENEW_BOOK',
      resource: 'BorrowRecord',
      resourceId: borrowRecordId,
      details: `Book renewed: ${borrowRecord.book.title} (Renewal #${borrowRecord.renewalCount})`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await auditLog.save();

    const renewalData = {
      borrowRecord: borrowRecord,
      newDueDate: newDueDate,
      renewalCount: borrowRecord.renewalCount,
      maxRenewals: maxRenewals,
      remainingRenewals: maxRenewals - borrowRecord.renewalCount
    };

    logger.info(`Book renewed by student: ${req.user.id}, record: ${borrowRecordId}`);
    return successResponse(res, 'Book renewed successfully', renewalData);

  } catch (error) {
    logger.error('Error renewing book:', error);
    return errorResponse(res, 'Failed to renew book', 500);
  }
});

// @desc    Check book availability
// @route   GET /api/library/availability/:bookId
// @access  Private (All authenticated users)
const getAvailability = asyncHandler(async (req, res) => {
  try {
    const { bookId } = req.params;

    const book = await Book.findById(bookId);
    if (!book) {
      return errorResponse(res, 'Book not found', 404);
    }

    // Get current borrowers
    const currentBorrows = await BorrowRecord.find({
      book: bookId,
      status: 'borrowed'
    })
    .populate('student', 'rollNumber user')
    .populate('student.user', 'firstName lastName')
    .select('borrowDate dueDate student');

    // Get waiting list/reservations
    const reservations = await BorrowRecord.find({
      book: bookId,
      status: 'reserved'
    })
    .populate('student', 'rollNumber user')
    .populate('student.user', 'firstName lastName')
    .sort({ createdAt: 1 });

    // Calculate estimated availability
    let estimatedAvailableDate = null;
    if (book.availableCopies === 0 && currentBorrows.length > 0) {
      // Find the earliest due date
      const earliestDueDate = currentBorrows.reduce((earliest, borrow) => {
        return !earliest || borrow.dueDate < earliest ? borrow.dueDate : earliest;
      }, null);
      estimatedAvailableDate = earliestDueDate;
    }

    const availabilityData = {
      book: {
        title: book.title,
        author: book.author,
        isbn: book.isbn
      },
      availability: {
        isAvailable: book.availableCopies > 0,
        totalCopies: book.totalCopies,
        availableCopies: book.availableCopies,
        borrowedCopies: currentBorrows.length,
        estimatedAvailableDate: estimatedAvailableDate
      },
      currentBorrows: req.user.role === 'student' ? [] : currentBorrows, // Hide for students
      reservations: reservations,
      waitingListPosition: null // Will be calculated if user is in queue
    };

    // If student, check their position in waiting list
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user.id });
      if (student) {
        const userReservation = reservations.findIndex(r => 
          r.student._id.equals(student._id)
        );
        if (userReservation !== -1) {
          availabilityData.waitingListPosition = userReservation + 1;
        }
      }
    }

    logger.info(`Book availability checked by user: ${req.user.id}, book: ${bookId}`);
    return successResponse(res, 'Book availability retrieved successfully', availabilityData);

  } catch (error) {
    logger.error('Error checking book availability:', error);
    return errorResponse(res, 'Failed to check book availability', 500);
  }
});

// @desc    Get borrowing history for a user
// @route   GET /api/library/borrow-history
// @access  Private (Student - own history, Admin/Librarian - all)
const getBorrowHistory = asyncHandler(async (req, res) => {
  try {
    const { 
      studentId, 
      status, 
      page = 1, 
      limit = 10,
      fromDate,
      toDate 
    } = req.query;

    let query = {};

    // Role-based filtering
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user.id });
      if (!student) {
        return errorResponse(res, 'Student profile not found', 404);
      }
      query.student = student._id;
    } else if (studentId) {
      query.student = studentId;
    }

    // Apply filters
    if (status) query.status = status;
    if (fromDate && toDate) {
      query.borrowDate = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate)
      };
    }

    const borrowHistory = await BorrowRecord.find(query)
      .populate('book', 'title author isbn')
      .populate('student', 'rollNumber studentId user')
      .populate('student.user', 'firstName lastName')
      .sort({ borrowDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await BorrowRecord.countDocuments(query);

    // Calculate statistics
    const stats = await BorrowRecord.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const historyData = {
      history: borrowHistory,
      statistics: stats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };

    logger.info(`Borrow history fetched by user: ${req.user.id}`);
    return successResponse(res, 'Borrow history retrieved successfully', historyData);

  } catch (error) {
    logger.error('Error fetching borrow history:', error);
    return errorResponse(res, 'Failed to fetch borrow history', 500);
  }
});

// @desc    Manage book inventory
// @route   POST /api/library/inventory
// @access  Private (Admin, Librarian)
const manageInventory = asyncHandler(async (req, res) => {
  try {
    const { action, bookData } = req.body;

    // Check permission
    if (req.user.role !== 'admin' && req.user.role !== 'librarian') {
      return errorResponse(res, 'Insufficient permissions to manage inventory', 403);
    }

    let result = {};

    switch (action) {
      case 'add':
        result = await addNewBook(bookData, req.user.id);
        break;
      case 'update':
        result = await updateBook(bookData, req.user.id);
        break;
      case 'remove':
        result = await removeBook(bookData.bookId, req.user.id);
        break;
      case 'adjust_copies':
        result = await adjustCopies(bookData.bookId, bookData.adjustment, req.user.id);
        break;
      default:
        return errorResponse(res, 'Invalid inventory action', 400);
    }

    // Log the action
    const auditLog = new AuditLog({
      user: req.user.id,
      action: `INVENTORY_${action.toUpperCase()}`,
      resource: 'Book',
      resourceId: result.bookId || bookData.bookId,
      details: `Inventory ${action}: ${result.details || 'Book inventory updated'}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await auditLog.save();

    logger.info(`Inventory managed by user: ${req.user.id}, action: ${action}`);
    return successResponse(res, `Inventory ${action} completed successfully`, result);

  } catch (error) {
    logger.error('Error managing inventory:', error);
    return errorResponse(res, 'Failed to manage inventory', 500);
  }
});

// Helper functions for inventory management
const addNewBook = async (bookData, userId) => {
  const book = new Book({
    ...bookData,
    availableCopies: bookData.totalCopies,
    addedBy: userId
  });
  await book.save();
  return { bookId: book._id, details: `Added new book: ${book.title}` };
};

const updateBook = async (bookData, userId) => {
  const book = await Book.findByIdAndUpdate(
    bookData.bookId,
    { ...bookData, lastModifiedBy: userId },
    { new: true }
  );
  return { bookId: book._id, details: `Updated book: ${book.title}` };
};

const removeBook = async (bookId, userId) => {
  const book = await Book.findById(bookId);
  
  // Check if book has active borrows
  const activeBorrows = await BorrowRecord.countDocuments({
    book: bookId,
    status: 'borrowed'
  });
  
  if (activeBorrows > 0) {
    throw new Error('Cannot remove book with active borrows');
  }
  
  await Book.findByIdAndDelete(bookId);
  return { bookId: bookId, details: `Removed book: ${book.title}` };
};

const adjustCopies = async (bookId, adjustment, userId) => {
  const book = await Book.findById(bookId);
  
  const newTotal = book.totalCopies + adjustment;
  const borrowed = book.totalCopies - book.availableCopies;
  
  if (newTotal < borrowed) {
    throw new Error('Cannot reduce copies below currently borrowed amount');
  }
  
  book.totalCopies = newTotal;
  book.availableCopies = newTotal - borrowed;
  book.lastModifiedBy = userId;
  await book.save();
  
  return { 
    bookId: bookId, 
    details: `Adjusted copies for ${book.title}: ${adjustment > 0 ? '+' : ''}${adjustment}` 
  };
};

module.exports = {
  getBooks,
  getBookDetails,
  borrowBook,
  returnBook,
  renewBook,
  getAvailability,
  getBorrowHistory,
  manageInventory
};