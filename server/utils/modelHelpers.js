const mongoose = require('mongoose');

class ModelHelpers {
  // Generate unique ID for students/faculty
  static generateUniqueId(prefix, year, department, sequence) {
    const yearStr = year.toString().slice(-2);
    const deptCode = department.toUpperCase().slice(0, 3);
    const seqStr = sequence.toString().padStart(3, '0');
    return `${prefix}${yearStr}${deptCode}${seqStr}`;
  }

  // Calculate age from date of birth
  static calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  // Calculate CGPA from grades
  static calculateCGPA(grades) {
    if (!grades || grades.length === 0) return 0;
    
    const gradePoints = {
      'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 'C+': 6, 'C': 5, 'D': 4, 'F': 0
    };
    
    let totalPoints = 0;
    let totalCredits = 0;
    
    grades.forEach(grade => {
      const points = gradePoints[grade.grade] || 0;
      totalPoints += points * grade.credits;
      totalCredits += grade.credits;
    });
    
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
  }

  // Generate academic year string
  static generateAcademicYear(startYear) {
    return `${startYear}-${(startYear + 1).toString().slice(-2)}`;
  }

  // Check if a date is within academic session
  static isWithinAcademicSession(date, sessionStart, sessionEnd) {
    const checkDate = new Date(date);
    const start = new Date(sessionStart);
    const end = new Date(sessionEnd);
    
    return checkDate >= start && checkDate <= end;
  }

  // Calculate attendance percentage
  static calculateAttendancePercentage(totalClasses, attendedClasses) {
    if (totalClasses === 0) return 0;
    return ((attendedClasses / totalClasses) * 100).toFixed(2);
  }

  // Generate receipt number
  static generateReceiptNumber(prefix = 'REC') {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}${timestamp}${random}`;
  }

  // Validate ObjectId
  static isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
  }

  // Format currency
  static formatCurrency(amount, currency = 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  // Calculate fine for overdue books
  static calculateLibraryFine(dueDate, returnDate, finePerDay = 2) {
    const due = new Date(dueDate);
    const returned = new Date(returnDate || new Date());
    
    if (returned <= due) return 0;
    
    const diffTime = Math.abs(returned - due);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays * finePerDay;
  }

  // Generate time slots for timetable
  static generateTimeSlots(startTime = '09:00', endTime = '17:00', slotDuration = 60) {
    const slots = [];
    let current = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    
    while (current < end) {
      const next = new Date(current.getTime() + slotDuration * 60000);
      slots.push({
        start: current.toTimeString().slice(0, 5),
        end: next.toTimeString().slice(0, 5)
      });
      current = next;
    }
    
    return slots;
  }
}

module.exports = ModelHelpers;