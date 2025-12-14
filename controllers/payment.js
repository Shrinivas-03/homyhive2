// controllers/payment.js
const razorpay = require("../utils/razorpay");
const crypto = require("crypto");
const Booking = require("../models/booking");
const Listing = require("../models/listing");
const User = require("../models/user");
const wrapAsync = require("../utils/wrapAsync");
const ExpressError = require("../utils/ExpressError");

// Render checkout page
module.exports.renderCheckout = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const { checkIn, checkOut, guests } = req.query;

  if (!checkIn || !checkOut || !guests) {
    throw new ExpressError(400, "Missing booking details");
  }

  const listing = await Listing.findById(id).populate("owner");
  if (!listing) {
    throw new ExpressError(404, "Listing not found");
  }

  // Calculate number of nights
  const oneDay = 24 * 60 * 60 * 1000;
  const nights = Math.round(
    Math.abs((new Date(checkOut) - new Date(checkIn)) / oneDay),
  );
  const subtotal = listing.price * nights;
  const totalAmount = Math.round(subtotal * 1.12);

  if (totalAmount <= 0) {
    throw new ExpressError(400, "Invalid booking dates or price");
  }

  res.render("payments/checkout", {
    listing,
    checkIn,
    checkOut,
    guests,
    nights,
    subtotal,
    totalAmount,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  });
});

// Create Razorpay Order
module.exports.createOrder = wrapAsync(async (req, res) => {
  const { listingId, checkIn, checkOut, guests } = req.body;

  if (!listingId || !checkIn || !checkOut || !guests) {
    throw new ExpressError(400, "Missing booking details");
  }

  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw new ExpressError(404, "Listing not found");
  }

  const oneDay = 24 * 60 * 60 * 1000;
  const nights = Math.round(
    Math.abs((new Date(checkOut) - new Date(checkIn)) / oneDay),
  );
  const subtotal = listing.price * nights;
  const totalAmount = Math.round(subtotal * 1.12); // Amount in rupees

  const options = {
    amount: totalAmount * 100, // Amount in paise
    currency: "INR",
    receipt: `receipt_booking_${Date.now()}`,
  };

  const order = await razorpay.orders.create(options);
  if (!order) {
    throw new ExpressError(500, "Failed to create Razorpay order");
  }

  res.json(order);
});

// Verify Payment and Create Booking
module.exports.verifyPayment = wrapAsync(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    listingId,
    checkIn,
    checkOut,
    guests,
    totalAmount,
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

    const platformFee = totalAmount * 0.1; // 10% commission
    const hostAmount = totalAmount - platformFee;

    const newBooking = new Booking({
      user: req.user._id,
      listing: listingId,
      host: listing.owner,
      checkIn,
      checkOut,
      guests,
      totalAmount,
      platformFee,
      hostAmount,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      paymentStatus: "completed",
      bookingStatus: "confirmed",
    });

    await newBooking.save();

    req.flash("success", "Booking successful! Your payment has been received.");
    res.redirect(`/listings/${listingId}`);
  } else {
    throw new ExpressError(400, "Invalid payment signature");
  }
});
