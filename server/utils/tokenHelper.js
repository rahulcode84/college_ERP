const crypto = require('crypto');
const jwt = require('jsonwebtoken');

class TokenHelper {
  /**
   * Generate a secure random token
   * @param {number} length - Token length in bytes
   * @returns {string} - Hex encoded token
   */
  static generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash a token using SHA256
   * @param {string} token - Token to hash
   * @returns {string} - Hashed token
   */
  static hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generate email verification token
   * @returns {object} - Token and hashed token
   */
  static generateEmailVerificationToken() {
    const token = this.generateSecureToken();
    const hashedToken = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    return {
      token,
      hashedToken,
      expiresAt
    };
  }

  /**
   * Generate password reset token
   * @returns {object} - Token and hashed token
   */
  static generatePasswordResetToken() {
    const token = this.generateSecureToken();
    const hashedToken = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    return {
      token,
      hashedToken,
      expiresAt
    };
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @param {string} secret - JWT secret
   * @returns {object} - Decoded token
   */
  static verifyJWT(token, secret) {
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Generate JWT token
   * @param {object} payload - Token payload
   * @param {string} secret - JWT secret
   * @param {string} expiresIn - Token expiration
   * @returns {string} - JWT token
   */
  static generateJWT(payload, secret, expiresIn = '24h') {
    return jwt.sign(payload, secret, { expiresIn });
  }

  /**
   * Check if token is expired
   * @param {Date} expiryDate - Token expiry date
   * @returns {boolean} - True if expired
   */
  static isTokenExpired(expiryDate) {
    return new Date() > new Date(expiryDate);
  }
}

module.exports = TokenHelper;