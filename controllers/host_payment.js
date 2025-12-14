// controllers/host_payment.js
const razorpay = require("../utils/razorpay");
const crypto = require("crypto");
const Listing = require("../models/listing");
const wrapAsync = require("../utils/wrapAsync");
const ExpressError = require("../utils/ExpressError");

const PROMOTION_FEE = 500; // ₹500 for a 7-day promotion
const PROMOTION_DAYS = 7;

// Render promotion checkout page
module.exports.renderPromotionCheckout = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    throw new ExpressError(404, "Listing not found");
  }

  res.render("payments/promote_checkout", {
    listing,
    promotionFee: PROMOTION_FEE,
    promotionDays: PROMOTION_DAYS,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  });
});

// Create Razorpay Order for promotion
module.exports.createPromotionOrder = wrapAsync(async (req, res) => {
  const options = {
    amount: PROMOTION_FEE * 100, // Amount in paise
    currency: "INR",
    receipt: `receipt_promotion_${Date.now()}`,
  };

  const order = await razorpay.orders.create(options);
  if (!order) {
    throw new ExpressError(500, "Failed to create Razorpay order");
  }

  res.json(order);
});

// Verify Promotion Payment and update listing
module.exports.verifyPromotionPayment = wrapAsync(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    listingId,
  } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;

  if (isAuthentic) {
    const listing = await Listing.findById(listingId);
    if (!listing) {
      throw new ExpressError(404, "Listing not found");
    }

    // Update listing with promotion expiry date
    const now = new Date();
    listing.promotionExpiresAt = new Date(now.setDate(now.getDate() + PROMOTION_DAYS));
    await listing.save();

    req.flash("success", "Promotion successful! Your listing will be featured for " + PROMOTION_DAYS + " days.");
    res.redirect(`/listings/${listingId}`);

  } else {
    throw new ExpressError(400, "Invalid payment signature");
  }
});
