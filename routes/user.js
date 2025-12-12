const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const userController = require("../controllers/users");

router
  .route("/signup")
  .get(userController.renderSignupForm)
  .post(wrapAsync(userController.signup));

router
  .route("/verify-otp")
  .get(userController.renderVerifyOtpForm)
  .post(wrapAsync(userController.verifyOtp));

router
  .route("/login")
  .get(userController.renderLoginForm)
  .post(wrapAsync(userController.login));



const { isLoggedIn } = require("../middleware");
// User profile
router.get("/user/profile", isLoggedIn, userController.renderProfile);
// User bookings
router.get("/user/bookings", isLoggedIn, userController.renderBookings);
// User wishlist
router.get("/user/wishlist", isLoggedIn, userController.renderWishlist);
// User settings
router.get("/user/settings", isLoggedIn, userController.renderSettings);
// User notifications
router.get("/user/notifications", isLoggedIn, userController.renderNotifications);

router.get("/logout", userController.logout);

module.exports = router;
