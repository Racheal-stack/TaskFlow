# TaskFlow Email Service Setup Guide

## Overview
TaskFlow now includes a robust email service for user verification, password resets, and notifications. The service supports multiple email providers and includes admin testing tools.

## Email Service Features
- ✅ Multi-provider support (Gmail, Outlook, Yahoo, SendGrid, Mailgun)
- ✅ Automatic Ethereal test account fallback for development
- ✅ Email verification for user registration
- ✅ Password reset emails
- ✅ Admin testing interface in Settings
- ✅ Comprehensive error handling and logging

## Email Provider Configurations

### 1. Gmail (Recommended for Development)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```
**Important**: Use App Password, not your regular Gmail password
1. Go to Google Account Settings
2. Security > 2-Step Verification (must be enabled)
3. App Passwords > Generate Password for "Mail"
4. Use generated password in SMTP_PASSWORD

### 2. Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_EMAIL=your-email@outlook.com
SMTP_PASSWORD=your-password
```

### 3. Yahoo Mail
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_EMAIL=your-email@yahoo.com
SMTP_PASSWORD=your-app-password
```

### 4. SendGrid (Production)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_EMAIL=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

### 5. Mailgun (Production)
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_EMAIL=postmaster@your-domain.mailgun.org
SMTP_PASSWORD=your-mailgun-password
```

## Testing Email Service

### 1. Automatic Ethereal Fallback
If no SMTP configuration is provided, the service automatically creates an Ethereal test account:
- Check console logs for Ethereal credentials
- All emails are captured and viewable at ethereal.email
- Perfect for development without real email setup

### 2. Admin Testing Interface
1. Set any user role to 'admin' in MongoDB
2. Login as admin user
3. Go to Settings > Admin Tools
4. Test email service status and send test emails

### 3. Manual Testing via API
```bash
# Get email service status
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5001/api/auth/email-status

# Send test email
curl -X POST \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"email":"test@example.com"}' \
     http://localhost:5001/api/auth/test-email
```

## User Registration Flow
1. User fills registration form
2. Account created but not verified
3. Verification code sent to email
4. User enters code on verification page
5. Account activated and can login

## Email Templates
The service includes styled HTML templates for:
- Email verification with 6-digit codes
- Password reset with secure links
- Test emails with service information

## Troubleshooting

### Common Issues
1. **"Email service not initialized"**
   - Check SMTP environment variables
   - Verify credentials are correct
   - Check network connectivity

2. **"Authentication failed"**
   - Use App Passwords for Gmail/Yahoo
   - Verify email/password combination
   - Check if 2FA is properly configured

3. **"Connection refused"**
   - Verify SMTP_HOST and SMTP_PORT
   - Check firewall/antivirus settings
   - Try different port (465 for SSL)

### Development Tips
- Always check console logs for email service status
- Use Ethereal for testing without real email accounts
- Test with admin interface before deploying
- Verify email templates in different clients

## Production Deployment
1. Use professional email service (SendGrid, Mailgun)
2. Configure proper FROM domain
3. Set up SPF/DKIM records
4. Monitor email delivery rates
5. Implement bounce handling

## Security Considerations
- Store SMTP passwords securely
- Use environment variables, never hardcode
- Implement rate limiting for email sending
- Monitor for email abuse
- Use secure connection (TLS/SSL)

## Next Steps
1. Configure your preferred email provider in .env
2. Test with admin interface
3. Verify registration flow works
4. Customize email templates as needed
5. Set up monitoring for production