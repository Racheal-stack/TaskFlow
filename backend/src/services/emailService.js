const nodemailer = require('nodemailer');
const Queue = require('bull');
const fs = require('fs').promises;
const path = require('path');

const emailQueue = new Queue('email', process.env.REDIS_URL || 'redis://127.0.0.1:6379');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
    this.setupQueue();
  }

  setupQueue() {
    emailQueue.process(async (job) => {
      const { to, subject, html, text } = job.data;
      
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@taskflow.com',
        to,
        subject,
        html,
        text
      };

      try {
        await this.transporter.sendMail(mailOptions);
        return { sent: true };
      } catch (error) {
        throw error;
      }
    });
  }

  queueEmail(to, subject, html, text) {
    return emailQueue.add(
      { to, subject, html, text },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    );
  }

  async sendTaskAssignmentEmail(user, task) {
    const html = `
      <h2>You've been assigned to a task</h2>
      <p>Hi ${user.name},</p>
      <p>You have been assigned to: <strong>${task.title}</strong></p>
      <p>${task.description || ''}</p>
      <a href="${process.env.FRONTEND_URL}/tasks/${task._id}">View Task</a>
    `;
    
    return this.queueEmail(user.email, 'Task Assignment', html, `You've been assigned to: ${task.title}`);
  }

  async sendMentionEmail(user, comment, task) {
    const html = `
      <h2>You were mentioned in a comment</h2>
      <p>Hi ${user.name},</p>
      <p>${comment.user.name} mentioned you in "${task.title}"</p>
      <p><em>${comment.text}</em></p>
      <a href="${process.env.FRONTEND_URL}/tasks/${task._id}">View Task</a>
    `;
    
    return this.queueEmail(user.email, 'New Mention', html, `You were mentioned in ${task.title}`);
  }

  async sendDueDateReminderEmail(user, task, hours) {
    const html = `
      <h2>Task Due Soon</h2>
      <p>Hi ${user.name},</p>
      <p>Task "${task.title}" is due in ${hours} hours.</p>
      <a href="${process.env.FRONTEND_URL}/tasks/${task._id}">View Task</a>
    `;
    
    return this.queueEmail(user.email, 'Task Due Soon', html, `Task "${task.title}" is due in ${hours} hours`);
  }

  async initializeTransporter() {
    try {
      const hasEmailConfig = process.env.SMTP_HOST && process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD;
      if (hasEmailConfig) {
        console.log('🔧 Setting up email with SMTP configuration...');
        this.transporter = nodemailer.createTransporter({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: parseInt(process.env.SMTP_PORT) === 465,
          auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD
          },
          tls: {
            rejectUnauthorized: false // For self-signed certificates
          }
        });
        await this.transporter.verify();
        console.log('✅ Email service initialized with SMTP');
      } else {
        console.log('🧪 No SMTP config found, using Ethereal for testing...');
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransporter({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        console.log('✅ Email service initialized with Ethereal');
        console.log('📧 Ethereal Account:', {
          user: testAccount.user,
          pass: testAccount.pass
        });
      }
    } catch (error) {
      console.error('❌ Email service initialization failed:', error.message);
      console.log('📝 To configure email service:');
      console.log('   1. Set SMTP_HOST (e.g., smtp.gmail.com)');
      console.log('   2. Set SMTP_EMAIL (your email address)');
      console.log('   3. Set SMTP_PASSWORD (your app password)');
      console.log('   4. Optionally set SMTP_PORT (default: 587)');
      this.transporter = null;
    }
  }
  async sendEmail({ to, subject, html, text }) {
    if (!this.transporter) {
      console.warn('⚠️ Email service not available, skipping email send');
      return { success: false, message: 'Email service not configured' };
    }
    try {
      const mailOptions = {
        from: `TaskFlow <${process.env.SMTP_EMAIL || 'noreply@taskflow.com'}>`,
        to,
        subject,
        html,
        text: text || this.htmlToText(html) // Auto-generate text version if not provided
      };
      console.log(`📤 Sending email to: ${to}`);
      console.log(`📋 Subject: ${subject}`);
      const info = await this.transporter.sendMail(mailOptions);
      if (process.env.NODE_ENV !== 'production') {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log('📧 Email sent! Preview URL:', previewUrl);
        } else {
          console.log('📧 Email sent successfully!');
        }
      } else {
        console.log('📧 Email sent successfully to:', to);
      }
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Email send failed:', error.message);
      return { success: false, message: error.message };
    }
  }
  htmlToText(html) {
    if (!html) return '';
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();
  }
  async sendTestEmail(to = 'test@example.com') {
    const subject = 'TaskFlow Email Service Test';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #7c3aed;">🎉 Email Service Working!</h2>
        <p>This is a test email from your TaskFlow application.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p>If you received this email, your email service is configured correctly!</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This is an automated test email from TaskFlow.
        </p>
      </div>
    `;
    return await this.sendEmail({ to, subject, html });
  }
  async sendVerificationEmail(email, verificationCode) {
    const subject = 'Verify Your Email - TaskFlow';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #7c3aed; margin: 0;">TaskFlow</h1>
        </div>
        <div style="background: #f8fafc; border-radius: 12px; padding: 30px; border-left: 4px solid #7c3aed;">
          <h2 style="color: #1e293b; margin-top: 0;">Email Verification</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            Thank you for signing up with TaskFlow! To complete your registration, please use the verification code below:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="background: #7c3aed; color: white; padding: 15px 30px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 2px; display: inline-block;">
              ${verificationCode}
            </div>
          </div>
          <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">
            This code will expire in 10 minutes. If you didn't create an account with TaskFlow, please ignore this email.
          </p>
        </div>
        <div style="text-align: center; margin-top: 30px; color: #94a3b8; font-size: 14px;">
          <p>Need help? Contact us at support@taskflow.com</p>
        </div>
      </div>
    `;
    return await this.sendEmail({
      to: email,
      subject,
      html
    });
  }
  async sendWelcomeEmail(user, workspace) {
    const subject = `Welcome to ${workspace.name} on TaskFlow!`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">Welcome to TaskFlow!</h1>
        <p>Hi ${user.name},</p>
        <p>Welcome to <strong>${workspace.name}</strong>! Your workspace has been created successfully.</p>
        <p>You can now:</p>
        <ul>
          <li>Create and manage projects</li>
          <li>Assign tasks to team members</li>
          <li>Track progress with real-time updates</li>
          <li>Collaborate with your team</li>
        </ul>
        <p><a href="${process.env.CLIENT_URL}/dashboard" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Get Started</a></p>
        <p>Happy organizing!<br>The TaskFlow Team</p>
      </div>
    `;
    return await this.sendEmail({
      to: user.email,
      subject,
      html
    });
  }
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    const subject = 'Password Reset Request - TaskFlow';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">Password Reset</h1>
        <p>Hi ${user.name},</p>
        <p>You requested a password reset for your TaskFlow account.</p>
        <p><a href="${resetUrl}" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        <p>This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
        <p>The TaskFlow Team</p>
      </div>
    `;
    return await this.sendEmail({
      to: user.email,
      subject,
      html
    });
  }
  async sendProjectInviteEmail(user, project, inviteLink) {
    const subject = `You've been invited to join "${project.name}"`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">Project Invitation</h1>
        <p>Hi ${user.name},</p>
        <p>You've been invited to join the project <strong>"${project.name}"</strong> on TaskFlow.</p>
        <p><a href="${inviteLink}" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Join Project</a></p>
        <p>The TaskFlow Team</p>
      </div>
    `;
    return await this.sendEmail({
      to: user.email,
      subject,
      html
    });
  }
  getProviderConfig(provider) {
    const configs = {
      gmail: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        note: 'Use App Password for Gmail (not regular password)'
      },
      outlook: {
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        note: 'Works with Outlook.com and Hotmail'
      },
      yahoo: {
        host: 'smtp.mail.yahoo.com',
        port: 587,
        secure: false,
        note: 'Use App Password for Yahoo Mail'
      },
      sendgrid: {
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        note: 'Use "apikey" as username and your API key as password'
      },
      mailgun: {
        host: 'smtp.mailgun.org',
        port: 587,
        secure: false,
        note: 'Use your Mailgun SMTP credentials'
      }
    };
    return configs[provider.toLowerCase()] || null;
  }
  async sendWorkspaceInvitation(email, workspaceName, inviterName, inviteLink, role) {
    const subject = `You've been invited to join ${workspaceName}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .info { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #667eea; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Workspace Invitation</h1>
          </div>
          <div class="content">
            <p>Hi there!</p>
            <p><strong>${inviterName}</strong> has invited you to join <strong>${workspaceName}</strong> on TaskFlow.</p>
            
            <div class="info">
              <p><strong>Your Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</p>
              <p><strong>Workspace:</strong> ${workspaceName}</p>
            </div>

            <p>Click the button below to accept this invitation and start collaborating:</p>
            
            <center>
              <a href="${inviteLink}" class="button">Accept Invitation</a>
            </center>

            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              Or copy and paste this link into your browser:<br>
              <a href="${inviteLink}" style="color: #667eea;">${inviteLink}</a>
            </p>

            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              ⏰ This invitation will expire in 7 days.<br>
              If you don't want to join this workspace, you can simply ignore this email.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} TaskFlow. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"TaskFlow" <${process.env.SMTP_EMAIL || 'noreply@taskflow.com'}>`,
      to: email,
      subject,
      html
    };

    const info = await this.transporter.sendMail(mailOptions);

    if (process.env.NODE_ENV !== 'production' && !process.env.SMTP_HOST) {
      console.log('📧 Workspace invitation email preview:', nodemailer.getTestMessageUrl(info));
    }

    return info;
  }

  getStatus() {
    return {
      initialized: !!this.transporter,
      provider: process.env.SMTP_HOST ? 'Custom SMTP' : 'Ethereal (Test)',
      configured: !!(process.env.SMTP_HOST && process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD)
    };
  }
}
module.exports = new EmailService();