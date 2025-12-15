// controllers/users.js
const Listing = require("../models/listing");
const supabase = require("../utils/supabase"); // ✅ Use consistent import
const sendMail = require("../utils/sendMail");
const bcrypt = require("bcryptjs");
const User = require("../models/user");

// Render user profile page
module.exports.renderProfile = async (req, res) => {
  try {
    const user = res.locals.currUser;
    if (!user) {
      req.flash("error", "User not found. Please log in again.");
      return res.redirect("/login");
    }

    const userListings = await Listing.find({ owner: user._id });
    res.render("users/profile.ejs", { user, userListings });
  } catch (err) {
    console.error("Profile render error:", err);
    req.flash("error", "Could not load profile.");
    res.redirect("/listings");
  }
};

// Render bookings page
module.exports.renderBookings = (req, res) => {
  const user = res.locals.currUser;
  res.render("users/bookings.ejs", { user });
};

// Render wishlist page
module.exports.renderWishlist = (req, res) => {
  const user = res.locals.currUser;
  res.render("users/wishlist.ejs", { user });
};

// Render settings page
module.exports.renderSettings = (req, res) => {
  const user = res.locals.currUser;
  if (!user) {
    req.flash("error", "User not found. Please log in again.");
    return res.redirect("/login");
  }
  res.render("users/settings.ejs", { user });
};

// Render notifications page
module.exports.renderNotifications = (req, res) => {
  const user = res.locals.currUser;
  res.render("users/notifications.ejs", { user });
};

// Render dashboard page
module.exports.renderDashboard = async (req, res) => {
  try {
    const user = res.locals.currUser;
    if (!user) {
      req.flash("error", "User not found. Please log in again.");
      return res.redirect("/login");
    }

    // Get user's listings
    const userListings = await Listing.find({ owner: user._id });
    const totalListings = userListings.length;
    
    // Calculate total views (sum of views from all listings)
    let totalViews = 0;
    userListings.forEach(listing => {
      totalViews += listing.views || 0;
    });
    
    // Calculate active bookings
    const activeBookings = 0; // TODO: Count active bookings from Booking model
    
    // Calculate total earnings
    const totalEarnings = 0; // TODO: Sum completed bookings revenue
    
    res.render("users/dashboard.ejs", { 
      user, 
      userListings, 
      totalListings,
      totalViews,
      activeBookings,
      totalEarnings
    });
  } catch (err) {
    console.error("Dashboard render error:", err);
    req.flash("error", "Could not load dashboard.");
    res.redirect("/listings");
  }
};

// ========================================
// SIGNUP FLOW
// ========================================

// Render Signup Page
module.exports.renderSignupForm = (req, res) => {
  res.render("users/signup.ejs");
};

// Generate OTP + Save temporary user data in session
module.exports.signup = async (req, res) => {
  try {
    let { username, email, phone, password } = req.body;

    if (!username || !email || !phone || !password) {
      req.flash("error", "All fields are required.");
      return res.redirect("/signup");
    }

    // Normalize email
    email = email.trim().toLowerCase();

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      req.flash("error", "Email already registered. Please login.");
      return res.redirect("/login");
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Store in session
    req.session.userData = { username, email, phone, password };
    req.session.otp = otp;

    // Send OTP email
    await sendMail(
      username,
      email,
      `Your OTP for HomyHive signup is: ${otp}`,
      "HomyHive OTP Verification",
    );

    req.flash("success", "OTP sent to your email!");
    res.redirect("/verify-otp");
  } catch (e) {
    console.error("Signup error:", e);
    req.flash("error", "Signup failed. Try again.");
    res.redirect("/signup");
  }
};

// Render OTP page
module.exports.renderVerifyOtpForm = (req, res) => {
  res.render("users/verify-otp.ejs");
};

// Verify OTP → Insert into Supabase table + create Mongo user
module.exports.verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!req.session.otp || !req.session.userData) {
      req.flash("error", "Session expired. Please signup again.");
      return res.redirect("/signup");
    }

    if (otp != req.session.otp) {
      req.flash("error", "Invalid OTP!");
      return res.redirect("/verify-otp");
    }

    const { username, email, phone, password } = req.session.userData;

    // Hash password before saving
    const password_hash = await bcrypt.hash(password, 12);

    // Insert into Supabase public.users table
    const { data, error } = await supabase
      .from("users")
      .insert([{ username, email, phone, password_hash }])
      .select()
      .single();

    console.log("Supabase insert data:", data);

    if (error) {
      console.error("Supabase insert error:", error);
      req.flash("error", "Something went wrong. Try again.");
      return res.redirect("/signup");
    }

    // Create matching Mongo user for app features
    try {
      const mongoUser = new User({
        email,
        displayName: username,
        phone,
        supabaseId: data.id ? String(data.id) : undefined,
      });
      await mongoUser.save();
      console.log("MongoDB user created successfully");
    } catch (mongoErr) {
      console.warn(
        "Mongo user creation failed (but Supabase user created):",
        mongoErr.message || mongoErr,
      );
    }

    // Clear session
    req.session.userData = null;
    req.session.otp = null;

    req.flash("success", "Account created! Please login.");
    res.redirect("/login");
  } catch (e) {
    console.error("Verify OTP Error:", e);
    req.flash("error", "Something went wrong.");
    res.redirect("/verify-otp");
  }
};

// ========================================
// LOGIN PAGE RENDER
// ========================================

// Render login page
module.exports.renderLoginForm = (req, res) => {
  res.render("users/login.ejs");
};
