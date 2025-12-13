// FILE: E:\homyhive2\routes\host.js
const express = require("express");
const router = express.Router();
const hostsController = require("../controllers/hosts");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

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
  hostsController.uploadDocuments,
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
  upload.fields([
    { name: "idFront", maxCount: 1 },
    { name: "idBack", maxCount: 1 },
  ]),
  catchAsync(hostsController.verifyGovernmentId),
);

router.get("/verify/status", (req, res) =>
  res.json({ id: "pending", bank: "pending", events: [] }),
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

module.exports = router;
