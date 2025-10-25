// server/routes/libraryRoutes.js

const express = require('express');
const router = express.Router();
const {
  getBooks,
  getBookDetails,
  borrowBook,
  returnBook,
  renewBook,
  getAvailability,
  getBorrowHistory,
  manageInventory
} = require('../controllers/libraryController');

const { authenticate, authorize } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Book catalog routes (all authenticated users)
router.get('/books', getBooks);
router.get('/books/:bookId', getBookDetails);
router.get('/availability/:bookId', getAvailability);

// Student borrowing routes
router.post('/borrow', authorize(['student']), borrowBook);
router.post('/return', authorize(['student', 'admin', 'librarian']), returnBook);
router.post('/renew', authorize(['student']), renewBook);

// Borrowing history
router.get('/borrow-history', getBorrowHistory); // Role-based filtering applied in controller

// Administrative routes
router.post('/inventory', authorize(['admin', 'librarian']), manageInventory);

module.exports = router;