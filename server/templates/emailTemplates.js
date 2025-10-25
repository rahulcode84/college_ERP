class EmailTemplates {
  static getWelcomeTemplate(user) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to College ERP</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .card { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .btn { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
          .info-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .info-label { font-weight: bold; color: #555; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Welcome to College ERP</h1>
            <p>Your academic journey starts here!</p>
          </div>
          
          <div class="content">
            <h2>Hello ${user.fullName}!</h2>
            <p>Welcome to our College ERP System. Your account has been successfully created and you're now part of our digital campus community.</p>
            
            <div class="card">
              <h3>📋 Your Account Details</h3>
              <div class="info-row">
                <span class="info-label">Name:</span>
                <span>${user.fullName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Email:</span>
                <span>${user.email}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Role:</span>
                <span>${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Account Status:</span>
                <span style="color: #28a745;">✅ Active</span>
              </div>
            </div>

            <div class="card">
              <h3>🚀 Getting Started</h3>
              <ul>
                <li><strong>Login:</strong> Use your email and password to access the system</li>
                <li><strong>Profile:</strong> Complete your profile information</li>
                <li><strong>Dashboard:</strong> Explore your personalized dashboard</li>
                <li><strong>Features:</strong> Access attendance, grades, notices, and more</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL}/login" class="btn">Access Your Dashboard</a>
            </div>

            <div class="card">
              <h3>🔒 Security Tips</h3>
              <ul>
                <li>Keep your password secure and don't share it with anyone</li>
                <li>Log out when using shared computers</li>
                <li>Report any suspicious activity to the administration</li>
                <li>Update your profile information regularly</li>
              </ul>
            </div>

            <div class="footer">
              <p>Need help? Contact our support team at <a href="mailto:support@college.edu">support@college.edu</a></p>
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>&copy; ${new Date().getFullYear()} College ERP System. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  static getPasswordResetTemplate(user, resetToken) {
    const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .card { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .btn { display: inline-block; background: #ff6b6b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .warning { background: #fff3cd; color: #856404; padding: 15px; border-radius: 4px; border-left: 4px solid #ffc107; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
            <p>Reset your College ERP password</p>
          </div>
          
          <div class="content">
            <h2>Hello ${user.fullName}!</h2>
            <p>We received a request to reset your password for your College ERP account. If you made this request, click the button below to reset your password.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetURL}" class="btn">Reset My Password</a>
            </div>

            <div class="warning">
              <h3>⚠️ Important Security Information</h3>
              <ul>
                <li><strong>Time Limit:</strong> This link will expire in 10 minutes for security</li>
                <li><strong>One-time Use:</strong> This link can only be used once</li>
                <li><strong>Secure:</strong> Only you should have access to this email</li>
              </ul>
            </div>

            <div class="card">
              <h3>Didn't request a password reset?</h3>
              <p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
              <p>However, if you're concerned about the security of your account, please:</p>
              <ul>
                <li>Change your password immediately after logging in</li>
                <li>Review your recent account activity</li>
                <li>Contact our support team if you notice anything suspicious</li>
              </ul>
            </div>

            <div class="card">
              <h3>Alternative Method</h3>
              <p>If the button above doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">${resetURL}</p>
            </div>

            <div class="footer">
              <p>Need help? Contact our support team at <a href="mailto:support@college.edu">support@college.edu</a></p>
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>&copy; ${new Date().getFullYear()} College ERP System. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  static getEmailVerificationTemplate(user, verificationToken) {
    const verificationURL = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .btn { display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 Verify Your Email</h1>
            <p>Complete your College ERP registration</p>
          </div>
          
          <div class="content">
            <h2>Hello ${user.fullName}!</h2>
            <p>Thank you for registering with College ERP. To complete your registration and activate your account, please verify your email address by clicking the button below.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationURL}" class="btn">Verify My Email</a>
            </div>

            <p>This verification link will expire in 24 hours for security purposes.</p>

            <div class="footer">
              <p>If you didn't create an account with us, please ignore this email.</p>
              <p>&copy; ${new Date().getFullYear()} College ERP System. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  static getPasswordChangeConfirmationTemplate(user) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Changed Successfully</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .success { background: #d4edda; color: #155724; padding: 15px; border-radius: 4px; border-left: 4px solid #28a745; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Changed</h1>
            <p>Your account security has been updated</p>
          </div>
          
          <div class="content">
            <h2>Hello ${user.fullName}!</h2>
            
            <div class="success">
              <h3>✅ Password Successfully Changed</h3>
              <p>Your password has been successfully updated on ${new Date().toLocaleString()}.</p>
            </div>

            <p>If you made this change, no further action is required. If you didn't change your password, please contact our support team immediately.</p>

            <div class="footer">
              <p>Need help? Contact our support team at <a href="mailto:support@college.edu">support@college.edu</a></p>
              <p>&copy; ${new Date().getFullYear()} College ERP System. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = EmailTemplates;