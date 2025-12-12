// controllers/supabaseAuth.js
const supabase = require('../utils/supabase');
const User = require('../models/user');

async function findOrCreateUserFromSupabaseUser(sbUser) {
  if (!sbUser) return null;
  const supabaseId = sbUser.id;
  // Try to find by supabaseId first
  let user = await User.findOne({ supabaseId });
  if (user) return user;

  // If not found, try by email and link
  if (sbUser.email) {
    user = await User.findOne({ email: sbUser.email });
    if (user) {
      user.supabaseId = supabaseId;
      await user.save();
      return user;
    }
  }

  // Create new local user
  const newUserData = {
    email: sbUser.email || '',
    supabaseId,
    displayName: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || '',
    profilePicture: { url: sbUser.user_metadata?.avatar_url || '' }
  };
  user = await User.create(newUserData);
  return user;
}

module.exports.signup = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      return res.status(400).json({ error: error.message || error });
    }

    // Signup usually requires email confirmation — don't auto-login.
    return res.json({ ok: true, data });
  } catch (err) {
    console.error('signup error', err);
    return res.status(500).json({ error: 'server error' });
  }
};

module.exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    // Sign in using Supabase - returns session.user if successful
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return res.status(401).json({ error: error.message || error });
    }

    const sbUser = data?.user;
    if (!sbUser) return res.status(401).json({ error: 'invalid credentials' });

    // Save supabase user to server session so your app can find it
    req.session.supabaseUser = sbUser;

    // Create or link a local Mongo user and optionally save local id in session
    const localUser = await findOrCreateUserFromSupabaseUser(sbUser);
    req.session.localUserId = localUser ? localUser._id : null;

    return res.json({ ok: true, user: { id: localUser._id, email: localUser.email, displayName: localUser.displayName } });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ error: 'server error' });
  }
};

module.exports.logout = async (req, res) => {
  try {
    // Clear server-side session mapping
    req.session.supabaseUser = null;
    req.session.localUserId = null;
    // Optionally call supabase.auth.signOut if you stored session client-side; server-side not required
    return res.json({ ok: true });
  } catch (err) {
    console.error('logout error', err);
    return res.status(500).json({ error: 'server error' });
  }
};
