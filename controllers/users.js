// Render user profile page

const Listing = require("../models/listing");
module.exports.renderProfile = async (req, res) => {
  try {
    const user = res.locals.currUser;
    if (!user) {
      req.flash("error", "User not found. Please log in again.");
      return res.redirect("/login");
    }
    // Fetch user's listings
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
// controllers/users.js
const supabase = require("../utils/supabase");
const sendMail = require("../utils/sendMail");
const bcrypt = require("bcryptjs");
const User = require("../models/user");

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

    // normalize email
    email = email.trim().toLowerCase();

    const otp = Math.floor(100000 + Math.random() * 900000);

    req.session.userData = { username, email, phone, password };
    req.session.otp = otp;

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

    // Insert into Supabase
    const { data, error } = await supabase
      .from("users")
      .insert([{ username, email, phone, password_hash }])
      .select()
      .single();

    console.log("Supabase insert data:", data);
    console.log("Supabase insert error:", error);

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

// Render login page
module.exports.renderLoginForm = (req, res) => {
  res.render("users/login.ejs");
};

// Login using email + password (Supabase table)
module.exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;

    email = (email || "").trim().toLowerCase();

    console.log("LOGIN ATTEMPT:", { email });

    const { data: user, error } = await supabase
      .from("users")
      .select("id, username, email, phone, password_hash")
      .eq("email", email)
      .single();

    console.log("Supabase login data:", user);
    console.log("Supabase login error:", error);

    if (error || !user) {
      req.flash("error", "Invalid email or password.");
      return res.redirect("/login");
    }

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    console.log("Password match:", isMatch);

    if (!isMatch) {
      req.flash("error", "Invalid email or password.");
      return res.redirect("/login");
    }

    // store in session under supabaseUser
    req.session.supabaseUser = user;

    console.log("SESSION AFTER LOGIN:", req.session);

    req.flash("success", "Welcome back!");
    const redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
  } catch (e) {
    console.error("Login error:", e);
    req.flash("error", "Login failed.");
    res.redirect("/login");
  }
};

// Logout
module.exports.logout = (req, res) => {
  req.session.supabaseUser = null;
  req.flash("success", "You are logged out!");
  res.redirect("/login");
};
