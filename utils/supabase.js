const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Supabase JWT auth middleware for Express
async function supabaseAuthMiddleware(req, res, next) {
	const authHeader = req.headers.authorization || '';
	const token = authHeader.replace('Bearer ', '');
	if (!token) return res.status(401).json({ message: 'No token' });
	const { data: { user }, error } = await supabase.auth.getUser(token);
	if (error || !user) return res.status(401).json({ message: 'Invalid token' });
	req.user = user;
	next();
}

supabase.supabaseAuthMiddleware = supabaseAuthMiddleware;
module.exports = supabase;
