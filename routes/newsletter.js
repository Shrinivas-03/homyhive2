const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Simple NewsletterEmail schema
const NewsletterEmailSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true }
});
const NewsletterEmail = mongoose.model('NewsletterEmail', NewsletterEmailSchema);

// Test route to verify newsletter router is working
router.get('/test', (req, res) => {
  res.json({ message: 'Newsletter router is working!', timestamp: new Date() });
});

// POST /newsletter
router.post('/', async (req, res) => {
  console.log('📧 Newsletter subscription attempt:', req.body);
  console.log('📧 Referer:', req.get('referer'));
  
  const { email } = req.body;
  const redirectUrl = req.get('referer') || '/';
  
  if (!email) {
    console.log('❌ No email provided');
    req.flash('error', 'Email address is required for newsletter subscription.');
    return res.redirect(redirectUrl);
  }
  
  try {
    await NewsletterEmail.create({ email });
    console.log('✅ Newsletter subscription successful:', email);
    req.flash('success', 'Thank you! You have successfully subscribed to our newsletter.');
    res.redirect(redirectUrl);
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate email
      console.log('⚠️ Email already subscribed:', email);
      req.flash('error', 'This email is already subscribed to our newsletter.');
      return res.redirect(redirectUrl);
    }
    console.error('💥 Newsletter subscription error:', err);
    req.flash('error', 'Failed to subscribe to newsletter. Please try again.');
    res.redirect(redirectUrl);
  }
});

module.exports = router;
