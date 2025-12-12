const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware.js");
const notificationController = require("../controllers/notifications.js");

// Get user notifications
router.get("/", isLoggedIn, wrapAsync(notificationController.getUserNotifications));

// Get unread notification count
router.get("/unread-count", isLoggedIn, wrapAsync(notificationController.getUnreadCount));

// Mark notifications as read
router.post("/mark-read", isLoggedIn, wrapAsync(notificationController.markAsRead));

// Mark all notifications as read
router.post("/mark-all-read", isLoggedIn, wrapAsync(notificationController.markAllAsRead));

// Create notification (for testing)
router.post("/create", isLoggedIn, wrapAsync(notificationController.createNotification));

module.exports = router;