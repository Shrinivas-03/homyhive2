const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin");
const hostController = require("../controllers/hosts");
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn, isAdmin } = require("../middleware");

// Admin dashboard (protected)
router.get(
  "/dashboard",
  isLoggedIn,
  isAdmin,
  wrapAsync(adminController.adminDashboard),
);

// Host requests management (protected)
router.get(
  "/host-requests",
  isLoggedIn,
  isAdmin,
  wrapAsync(adminController.viewHostRequests),
);
router.get(
  "/host-requests/:id",
  isLoggedIn,
  isAdmin,
  wrapAsync(adminController.viewHostDetails),
);
router.put(
  "/host-requests/:id/status",
  isLoggedIn,
  isAdmin,
  wrapAsync(adminController.updateHostStatus),
);

router.post(
  "/host-requests/:id/approve",
  isLoggedIn,
  isAdmin,
  wrapAsync(adminController.approveHost),
);
router.post(
  "/host-requests/:id/reject",
  isLoggedIn,
  isAdmin,
  wrapAsync(adminController.rejectHost),
);

router.post(
  "/host-requests/:id/enable-property-creation",
  isLoggedIn,
  isAdmin,
  wrapAsync(adminController.enablePropertyCreation),
);

router.get(
  "/hosts",
  isLoggedIn,
  isAdmin,
  wrapAsync(hostController.getAllHostApplications),
);
router.post(
  "/hosts/:applicationId/status",
  isLoggedIn,
  isAdmin,
  wrapAsync(hostController.updateApplicationStatus),
);

router.get(
  "/pending-approvals",
  isLoggedIn,
  isAdmin,
  wrapAsync(adminController.viewPendingApprovals),
);

router.post(
  "/approve-property/:id",
  isLoggedIn,
  isAdmin,
  wrapAsync(adminController.approveProperty),
);

router.post(
  "/reject-property/:id",
  isLoggedIn,
  isAdmin,
  wrapAsync(adminController.rejectProperty),
);

module.exports = router;
