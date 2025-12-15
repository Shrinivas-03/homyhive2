// Test host ID submission
const FormData = require('form-data');
const fs = require('fs');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testIdSubmission() {
  try {
    console.log('Testing host ID submission...\n');

    // Create a simple test image/PDF
    const testFilePath = '/tmp/test-id.txt';
    fs.writeFileSync(testFilePath, 'Test ID Document');

    const form = new FormData();
    form.append('idType', 'aadhaar');
    form.append('idNumber', '123456789012');
    form.append('idFront', fs.createReadStream(testFilePath));

    console.log('Submitting ID to /host/verify-id...');
    
    // You would need to provide a valid session cookie
    const response = await fetch('http://localhost:3000/host/verify-id', {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
      credentials: 'include'
    });

    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));

  } catch (err) {
    console.error('Error:', err.message);
  }
}

testIdSubmission();
