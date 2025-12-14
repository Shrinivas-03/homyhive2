const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Supabase JWT auth middleware for Express
// Supports both:
// 1. Express session (for browser requests with cookies)
// 2. Bearer token in Authorization header (for API calls)
async function supabaseAuthMiddleware(req, res, next) {
	// OPTION 1: Check Express session first (browser requests)
	if (req.session?.supabaseUser) {
		console.log('✓ User authenticated via session:', req.session.supabaseUser.email);
		req.user = req.session.supabaseUser;
		return next();
	}

	// OPTION 2: Check Bearer token (API requests)
	const authHeader = req.headers.authorization || '';
	console.log('Auth header present:', !!authHeader);
	
	if (!authHeader.startsWith('Bearer ')) {
		console.log('No Bearer token found and no session');
		return res.status(401).json({ success: false, message: 'No authorization provided. Please log in.' });
	}
	
	const token = authHeader.slice(7); // Remove 'Bearer ' prefix
	console.log('Extracted token:', token.substring(0, 20) + '...');
	
	if (!token) {
		return res.status(401).json({ success: false, message: 'Invalid authorization header format' });
	}
	
	try {
		const { data: { user }, error } = await supabase.auth.getUser(token);
		if (error) {
			console.error('Supabase auth error:', error);
			return res.status(401).json({ success: false, message: 'Invalid or expired token: ' + error.message });
		}
		if (!user) {
			return res.status(401).json({ success: false, message: 'User not found in token' });
		}
		console.log('User authenticated via token:', user.id);
		req.user = user; // Supabase user object with id, email, etc.
		next();
	} catch (err) {
		console.error('Token validation exception:', err);
		return res.status(401).json({ success: false, message: 'Token validation failed: ' + err.message });
	}
}

supabase.supabaseAuthMiddleware = supabaseAuthMiddleware;
module.exports = supabase;
