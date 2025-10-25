const User = require('./User');
const Department = require('./Department');
const Student = require('./Student');
const Faculty = require('./Faculty');
const Course = require('./Course');
const Enrollment = require('./Enrollment');
const Attendance = require('./Attendance');
const Fee = require('./Fee');
const Book = require('./Library');
const BorrowRecord = require('./BorrowRecord');
const Notice = require('./Notice');
const Timetable = require('./Timetable');
const AuditLog = require('./AuditLog');

module.exports = {
  User,
  Department,
  Student,
  Faculty,
  Course,
  Enrollment,
  Attendance,
  Fee,
  Book,
  BorrowRecord,
  Notice,
  Timetable,
  AuditLog
};