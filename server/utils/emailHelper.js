const nodemailer = require('nodemailer');
const EmailTemplates = require('../templates/emailTemplates');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify connection configuration
    this.verifyConnection();
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email service ready');
    } catch (error) {
      console.error('❌ Email service error:', error.message);
    }
  }

  async sendEmail(to, subject, html, text = null) {
    try {
      const mailOptions = {
        from: `"${process.env.FROM_NAME || 'College ERP'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        ...(text && { text })
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('📧 Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('❌ Email error:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendWelcomeEmail(user) {
    const subject = 'Welcome to College ERP System';
    const html = EmailTemplates.getWelcomeTemplate(user);
    return this.sendEmail(user.email, subject, html);
  }

  async sendPasswordResetEmail(user, resetToken) {
    const subject = 'Password Reset Request - College ERP';
    const html = EmailTemplates.getPasswordResetTemplate(user, resetToken);
    return this.sendEmail(user.email, subject, html);
  }

  async sendEmailVerification(user, verificationToken) {
    const subject = 'Verify Your Email - College ERP';
    const html = EmailTemplates.getEmailVerificationTemplate(user, verificationToken);
    return this.sendEmail(user.email, subject, html);
  }

  async sendPasswordChangeConfirmation(user) {
    const subject = 'Password Changed Successfully - College ERP';
    const html = EmailTemplates.getPasswordChangeConfirmationTemplate(user);
    return this.sendEmail(user.email, subject, html);
  }

  // Bulk email functionality
  async sendBulkEmail(recipients, subject, html) {
    const promises = recipients.map(recipient => 
      this.sendEmail(recipient.email, subject, html)
    );
    
    try {
      const results = await Promise.allSettled(promises);
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;
      
      console.log(`📧 Bulk email completed: ${successful} sent, ${failed} failed`);
      return { successful, failed, results };
    } catch (error) {
      console.error('❌ Bulk email error:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();