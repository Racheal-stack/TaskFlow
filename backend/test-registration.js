// Simple test to verify registration endpoint
const testRegistration = async () => {
  try {
    console.log('🧪 Testing registration endpoint...\n');
    
    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      workspaceName: 'Test Workspace'
    };
    
    console.log('📤 Sending registration request...');
    
    const response = await fetch('http://localhost:5001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });
    
    const data = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📋 Response Data:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ Registration endpoint working correctly!');
      console.log('👤 User created:', data.user.name, '(' + data.user.email + ')');
      console.log('📧 Email verified:', data.user.isEmailVerified);
    } else {
      console.log('❌ Registration failed:', data.message);
    }
    
  } catch (error) {
    console.error('🚫 Test failed:', error.message);
    console.log('\n💡 Make sure the backend server is running on port 5001');
    console.log('   Run: cd backend && npm run dev');
  }
};

testRegistration();