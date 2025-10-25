const crypto = require('crypto');
const bcrypt = require('bcryptjs');

class AuthHelper {
  /**
   * Generate a strong password
   * @param {number} length - Password length
   * @returns {string} - Generated password
   */
  static generateStrongPassword(length = 12) {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    let password = '';
    
    // Ensure at least one character from each set
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Check password strength
   * @param {string} password - Password to check
   * @returns {object} - Strength analysis
   */
  static checkPasswordStrength(password) {
    const analysis = {
      score: 0,
      feedback: [],
      strength: 'weak'
    };

    if (password.length >= 8) {
      analysis.score += 1;
    } else {
      analysis.feedback.push('Password should be at least 8 characters long');
    }

    if (/[a-z]/.test(password)) {
      analysis.score += 1;
    } else {
      analysis.feedback.push('Password should contain lowercase letters');
    }

    if (/[A-Z]/.test(password)) {
      analysis.score += 1;
    } else {
      analysis.feedback.push('Password should contain uppercase letters');
    }

    if (/\d/.test(password)) {
      analysis.score += 1;
    } else {
      analysis.feedback.push('Password should contain numbers');
    }

    if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
      analysis.score += 1;
    } else {
      analysis.feedback.push('Password should contain special characters');
    }

    // Determine strength
    if (analysis.score >= 4) {
      analysis.strength = 'strong';
    } else if (analysis.score >= 3) {
      analysis.strength = 'medium';
    }

    return analysis;
  }

  /**
   * Generate user session data
   * @param {object} user - User object
   * @returns {object} - Session data
   */
  static generateSessionData(user) {
    return {
      id: user._id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin,
      sessionCreated: new Date()
    };
  }

  /**
   * Validate user role permissions
   * @param {string} userRole - User's role
   * @param {array} allowedRoles - Allowed roles for operation
   * @returns {boolean} - Permission status
   */
  static hasPermission(userRole, allowedRoles) {
    return allowedRoles.includes(userRole) || allowedRoles.includes('all');
  }

  /**
   * Generate unique username from email
   * @param {string} email - User email
   * @returns {string} - Generated username
   */
  static generateUsername(email) {
    const emailPart = email.split('@')[0];
    const randomSuffix = Math.floor(Math.random() * 10000);
    return `${emailPart}${randomSuffix}`;
  }

  /**
   * Sanitize user input
   * @param {object} data - Data to sanitize
   * @returns {object} - Sanitized data
   */
  static sanitizeInput(data) {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        sanitized[key] = value.trim().replace(/[<>]/g, '');
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Generate temporary password for new users
   * @returns {string} - Temporary password
   */
  static generateTempPassword() {
    const adjectives = ['Quick', 'Smart', 'Bright', 'Swift', 'Bold', 'Cool'];
    const nouns = ['Tiger', 'Eagle', 'Lion', 'Wolf', 'Bear', 'Fox'];
    const numbers = Math.floor(Math.random() * 1000);
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${adjective}${noun}${numbers}!`;
  }
}

module.exports = AuthHelper;