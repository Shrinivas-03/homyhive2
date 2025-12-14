// routes/host_payment.js
const express = require("express");
const router = express.Router();
const hostPaymentController = require("../controllers/host_payment");
const { isLoggedIn, isOwner } = require("../middleware");

// Render promotion checkout page
router.get(
  "/listings/:id/promote",
  isLoggedIn,
  isOwner,
  hostPaymentController.renderPromotionCheckout
);

// Create Razorpay order for promotion
router.post(
  "/promote/create-order",
  isLoggedIn,
  hostPaymentController.createPromotionOrder
);

// Verify promotion payment
router.post(
  "/promote/verify-payment",
  isLoggedIn,
  hostPaymentController.verifyPromotionPayment
);

module.exports = router;
