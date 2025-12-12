// routes/supabaseAuth.js
const express = require('express');
const router = express.Router();
const auth = require('../controllers/supabaseAuth');

// POST endpoints for auth - these override the old passport-local flows
router.post('/signup', auth.signup);
router.post('/login', auth.login);
router.get('/logout', auth.logout);

module.exports = router;
