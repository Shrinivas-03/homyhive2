// utils/razorpay.js
const Razorpay = require("razorpay");
const dotenv = require("dotenv");

dotenv.config();

/**
 * Razorpay instance
 *
 * We are initializing a new Razorpay instance with the API keys
 * from the environment variables.
 *
 * Make sure to add the following to your .env file:
 * RAZORPAY_KEY_ID=your_key_id
 * RAZORPAY_KEY_SECRET=your_key_secret
 */
const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = instance;
