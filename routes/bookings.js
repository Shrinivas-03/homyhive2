// routes/bookings.js
const express = require("express");
const router = express.Router({ mergeParams: true });
const paymentController = require("../controllers/payment");
const { isLoggedIn } = require("../middleware");

// GET /listings/:id/book - Render checkout page
router.get("/", isLoggedIn, paymentController.renderCheckout);

module.exports = router;
