// Load environment variables from .env for local testing
try { require('dotenv').config(); } catch (e) {}
const supabase = require('./utils/supabase');

(async () => {
  console.log('--- Supabase local connectivity test ---');
  console.log('SUPABASE_URL set?', !!process.env.SUPABASE_URL);
  console.log('SUPABASE_KEY set?', !!(process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY));

  try {
    const url = process.env.SUPABASE_URL;
    if (url) {
      console.log('Attempting HTTP GET to SUPABASE_URL...');
      const res = await fetch(url, { method: 'GET' });
      console.log('GET', url, '->', res.status, res.statusText);
    } else {
      console.log('No SUPABASE_URL to fetch.');
    }
  } catch (err) {
    console.error('fetch(SUPABASE_URL) failed:', err && err.message ? err.message : err);
  }

  // Try a simple anonymous read from 'profiles' (requires proper key/permissions)
  try {
    console.log('Attempting supabase.from("profiles").select("id").limit(1) ...');
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    console.log('profiles select -> error:', error, 'data:', data);
  } catch (err) {
    console.error('profiles select exception:', err && err.message ? err.message : err);
  }

  // Try signing up a test user. You can provide SUPABASE_TEST_EMAIL and SUPABASE_TEST_PASSWORD
  // in the environment to run a targeted test. Password will not be printed.
  try {
    const testEmail = process.env.SUPABASE_TEST_EMAIL || `autotest+${Date.now()}@example.com`;
    const testPassword = process.env.SUPABASE_TEST_PASSWORD || 'Test1234!';
    const maskedEmail = testEmail ? `${testEmail.split('@')[0].slice(0,3)}***@${testEmail.split('@')[1]}` : 'N/A';
    console.log('Attempting supabase.auth.signUp with email (masked):', maskedEmail);
    const { data, error } = await supabase.auth.signUp({ email: testEmail, password: testPassword, options: { data: { autotest: true } } });
    if (error) console.log('signUp -> error:', error);
    else console.log('signUp -> success: user created (or confirmation required). data.user present? ', !!(data && data.user));
  } catch (err) {
    console.error('auth.signUp exception:', err && err.message ? err.message : err);
  }

  console.log('--- test complete ---');
  process.exit(0);
})();
