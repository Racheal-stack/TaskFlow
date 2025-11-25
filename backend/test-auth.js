const http = require('http');

function makeRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 5001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            reject({ statusCode: res.statusCode, response });
          }
        } catch (error) {
          reject({ statusCode: res.statusCode, error: error.message, body });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function testRegistration() {
  try {
    const response = await makeRequest('POST', '/api/auth/register', {
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'password123',
      workspaceName: 'Test Workspace'
    });
    
    console.log('Registration successful:', response);
    return response;
  } catch (error) {
    console.error('Registration failed:', error.response || error);
    return null;
  }
}

async function testLogin() {
  try {
    const response = await makeRequest('POST', '/api/auth/login', {
      email: 'testuser@example.com',
      password: 'password123'
    });
    
    console.log('Login successful:', response);
    return response;
  } catch (error) {
    console.error('Login failed:', error.response || error);
    return null;
  }
}

async function runTests() {
  console.log('Testing registration...');
  const regResult = await testRegistration();
  
  if (regResult) {
    console.log('\nTesting login...');
    await testLogin();
  } else {
    console.log('\nSkipping login test due to registration failure');
  }
}

runTests();