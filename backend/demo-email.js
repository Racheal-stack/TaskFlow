const emailService = require('./src/services/emailService');

console.log('🚀 TaskFlow Email Service Demo\n');

// Initialize the service
console.log('1. Initializing email service...');
const status = emailService.getStatus();
console.log('   Status:', status);

// Show available provider configurations
console.log('\n2. Available email provider configurations:');
const providers = ['gmail', 'outlook', 'yahoo', 'sendgrid', 'mailgun'];
providers.forEach(provider => {
  const config = emailService.getProviderConfig(provider);
  console.log(`   ${provider.toUpperCase()}:`, config);
});

// Demo email templates
console.log('\n3. Email service capabilities:');
console.log('   ✅ Email verification with 6-digit codes');
console.log('   ✅ Password reset with secure links');  
console.log('   ✅ HTML email templates with styling');
console.log('   ✅ Automatic text version generation');
console.log('   ✅ Multi-provider support with fallback');
console.log('   ✅ Admin testing interface');
console.log('   ✅ Comprehensive error handling');

// Test email functionality if service is available
if (status.initialized) {
  console.log('\n4. Testing email functionality...');
  
  // You can uncomment and modify this to test with a real email
  /*
  emailService.sendTestEmail('your-test-email@example.com')
    .then(result => {
      console.log('   Test email result:', result);
    })
    .catch(error => {
      console.error('   Test email failed:', error);
    });
  */
  
  console.log('   📧 Email service is ready to send emails!');
  if (status.provider === 'ethereal') {
    console.log('   🧪 Using Ethereal test account - emails captured at ethereal.email');
  } else {
    console.log(`   📬 Using ${status.provider} provider`);
  }
} else {
  console.log('\n4. Email service not configured');
  console.log('   💡 Set SMTP_* environment variables or use Ethereal fallback');
}

console.log('\n✨ Email service demo complete!');
console.log('📖 See EMAIL_SETUP_GUIDE.md for configuration instructions');