// FILE: E:\homyhive2\routes\host.js
const express = require("express");
const router = express.Router();
const hostsController = require("../controllers/hosts");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });
const supabase = require("../utils/supabase");

// Helper wrapper to catch async errors automatically
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// --- Routes ---

// Register a new host
router.post("/register", catchAsync(hostsController.hostRegister));

// Upload documents (uses 'uploadDocuments' middleware first)
router.post(
  "/upload/:applicationId",
  supabase.supabaseAuthMiddleware,
  upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "governmentId", maxCount: 1 },
    { name: "bankStatement", maxCount: 1 },
    { name: "addressProof", maxCount: 1 },
  ]),
  catchAsync(hostsController.handleDocumentUpload),
);

// Get application status
router.get(
  "/status/:applicationId",
  catchAsync(hostsController.getApplicationStatus),
);

// Real-time validation checks
router.post("/check-email", catchAsync(hostsController.checkEmailAvailability));
router.post("/verify-phone", catchAsync(hostsController.verifyPhone));
router.post("/verify-ifsc", catchAsync(hostsController.ifscLookup));
router.post("/verify-pincode", catchAsync(hostsController.pincodeVerify));
router.post(
  "/verify-id",
  supabase.supabaseAuthMiddleware,
  upload.fields([
    { name: "idFront", maxCount: 1 },
    { name: "idBack", maxCount: 1 },
  ]),
  catchAsync(hostsController.verifyGovernmentId),
);

router.post(
  "/verify-bank",
  supabase.supabaseAuthMiddleware,
  catchAsync(hostsController.verifyBank),
);

router.get(
  "/verify/status",
  supabase.supabaseAuthMiddleware,
  async (req, res) => {
    if (!req.user)
      return res.json({
        id: "not_submitted",
        bank: "not_verified",
        events: [],
      });
    const host = await require("../models/host").findOne({
      supabaseUserId: req.user.id,
    });
    if (!host)
      return res.json({
        id: "not_submitted",
        bank: "not_verified",
        events: [],
      });
    res.json({
      id: host.idVerification?.status || "not_submitted",
      bank: host.bankVerification?.status || "not_verified",
      events: [], // Optionally, add a log of status changes
    });
  },
);

// Admin routes
router.get("/all", catchAsync(hostsController.getAllHostApplications));
router.put(
  "/status/:applicationId",
  catchAsync(hostsController.updateApplicationStatus),
);

router.post(
  "/onboarding-complete",
  upload.fields([
    { name: "hostProfilePhoto", maxCount: 1 },
    { name: "propertyImages", maxCount: 8 },
    { name: "propertyVideo", maxCount: 1 },
  ]),
  catchAsync(hostsController.completeOnboarding),
);

// Razorpay onboarding payment order
router.post(
  "/create-onboarding-order",
  catchAsync(hostsController.createOnboardingOrder),
);

// Razorpay onboarding payment verification
router.post(
  "/verify-onboarding-payment",
  catchAsync(hostsController.verifyOnboardingPayment),
);

// Listing creation
router.get("/listings/new", catchAsync(hostsController.renderNewListingForm));
router.post(
  "/listings",
  upload.array("listing[image]"),
  catchAsync(hostsController.createListing),
);

module.exports = router;
