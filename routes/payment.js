// routes/payment.js
const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment");
const { isLoggedIn } = require("../middleware");

// Render checkout page
router.get("/listings/:id/book", isLoggedIn, paymentController.renderCheckout);

// Create Razorpay order
router.post("/create-order", isLoggedIn, paymentController.createOrder);

// Verify payment and create booking
router.post("/verify-payment", isLoggedIn, paymentController.verifyPayment);

module.exports = router;
