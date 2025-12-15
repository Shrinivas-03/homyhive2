// Test i18next loading behavior
const http = require('http');
const path = require('path');

function testFetch(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            status: res.statusCode,
            contentType: res.headers['content-type'],
            size: data.length,
            keys: Object.keys(json).length,
            sample: json.explore
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            error: 'JSON parse error: ' + e.message,
            rawData: data.substring(0, 200)
          });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.abort();
      reject(new Error('Timeout'));
    });
  });
}

async function test() {
  console.log('Testing translation file HTTP endpoints...\n');
  
  const urls = [
    'http://localhost:3000/locales/en/translation.json',
    'http://localhost:3000/locales/hi/translation.json',
    'http://localhost:3000/locales/kn/translation.json'
  ];
  
  for (const url of urls) {
    try {
      console.log('Testing:', url);
      const result = await testFetch(url);
      console.log('  Status:', result.status);
      console.log('  Content-Type:', result.contentType);
      console.log('  Size:', result.size, 'bytes');
      console.log('  Keys:', result.keys);
      console.log('  Sample (explore):', result.sample);
      if (result.error) console.log('  Error:', result.error);
      console.log();
    } catch (err) {
      console.error('  Failed:', err.message);
      console.log();
    }
  }
}

test();
