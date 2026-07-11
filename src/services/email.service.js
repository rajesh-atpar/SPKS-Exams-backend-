import nodemailer from 'nodemailer';
import logger from '../config/logger.js';

export class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }

  async sendEmail(to, subject, html, text = null) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@spksexams.com',
        to,
        subject,
        html,
        text
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info(`Email sent: ${info.messageId}`);
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Email sending error:', error);
      throw error;
    }
  }

  async sendExamAssignedEmail(studentEmail, studentName, examTitle, startDate, endDate) {
    const subject = 'New Exam Assigned';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Exam Assigned</h2>
        <p>Dear ${studentName},</p>
        <p>You have been assigned to a new exam:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">${examTitle}</h3>
          <p><strong>Start Date:</strong> ${new Date(startDate).toLocaleString()}</p>
          <p><strong>End Date:</strong> ${new Date(endDate).toLocaleString()}</p>
        </div>
        <p>Please log in to your account to view the exam details.</p>
        <p>Best regards,<br>SPKS Exams Team</p>
      </div>
    `;

    return this.sendEmail(studentEmail, subject, html);
  }

  async sendResultPublishedEmail(studentEmail, studentName, examTitle, percentage, isPassed) {
    const subject = 'Exam Result Published';
    const statusColor = isPassed ? '#28a745' : '#dc3545';
    const statusText = isPassed ? 'PASSED' : 'FAILED';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Exam Result Published</h2>
        <p>Dear ${studentName},</p>
        <p>Your result for the following exam has been published:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">${examTitle}</h3>
          <p><strong>Score:</strong> ${percentage.toFixed(2)}%</p>
          <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span></p>
        </div>
        <p>Please log in to your account to view the detailed result.</p>
        <p>Best regards,<br>SPKS Exams Team</p>
      </div>
    `;

    return this.sendEmail(studentEmail, subject, html);
  }

  async sendPasswordResetEmail(email, resetToken) {
    const subject = 'Password Reset Request';
    const resetLink = `${process.env.FRONTEND_STUDENT_URL}/reset-password?token=${resetToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You have requested to reset your password.</p>
        <p>Click the link below to reset your password:</p>
        <p><a href="${resetLink}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
        <p>Best regards,<br>SPKS Exams Team</p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  async sendEmailVerificationEmail(email, verificationToken) {
    const subject = 'Email Verification';
    const verificationLink = `${process.env.FRONTEND_STUDENT_URL}/verify-email?token=${verificationToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Email Verification</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <p><a href="${verificationLink}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>Best regards,<br>SPKS Exams Team</p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }
}

export default new EmailService();
