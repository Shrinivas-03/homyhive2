// --- Razorpay Onboarding Payment Integration ---
const razorpay = require("../utils/razorpay");
const crypto = require("crypto");

// POST /host/create-onboarding-order
module.exports.createOnboardingOrder = async (req, res) => {
  const { hostId } = req.body;
  if (!hostId) return res.status(400).json({ success: false, message: "Missing hostId" });
  // You can set a fixed onboarding fee or fetch from config
  const amount = 49900; // ₹499.00 in paise
  const currency = "INR";
  const receipt = `onboard_${hostId}_${Date.now()}`;
  try {
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt,
      payment_capture: 1
    });
    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error("Razorpay order error:", err);
    res.status(500).json({ success: false, message: "Failed to create order" });
  }
};

// POST /host/verify-onboarding-payment
module.exports.verifyOnboardingPayment = async (req, res) => {
  const { hostId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
  if (!hostId || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return res.status(400).json({ success: false, message: "Missing payment details" });
  }
  // Verify signature
  const generated_signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest('hex');
  if (generated_signature !== razorpay_signature) {
    return res.status(400).json({ success: false, message: "Invalid payment signature" });
  }
  // Mark host as paid (add a field if needed)
  try {
    const host = await Host.findById(hostId);
    if (!host) return res.status(404).json({ success: false, message: "Host not found" });
    host.onboardingFeePaid = true;
    host.onboardingPayment = {
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      paidAt: new Date()
    };
    await host.save();
    res.json({ success: true });
  } catch (err) {
    console.error("Payment verification error:", err);
    res.status(500).json({ success: false, message: "Failed to verify payment" });
  }
};
// FILE: E:\homyhive2\controllers\hosts.js
const Host = require("../models/host"); // Ensure filename matches your actual model file
const Listing = require("../models/listing.js");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// --- Multer Configuration ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../public/uploads/host-documents");
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + fileExtension);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only images and documents (PDF, DOC) are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter,
});

// Export Multer Middleware
module.exports.uploadDocuments = upload.fields([
  { name: "profilePhoto", maxCount: 1 },
  { name: "governmentId", maxCount: 1 },
  { name: "bankStatement", maxCount: 1 },
  { name: "addressProof", maxCount: 1 },
]);

// --- Controllers ---

module.exports.renderHostOnboarding = async (req, res) => {
  let host = null;
  let listing = null;

  if (req.user) {
    host = await Host.findOne({ user: req.user._id });
    if (host) {
      listing = await Listing.findOne({ host: host._id });
    }
  }

  res.render("static/host", { host, listing });
};

module.exports.hostRegister = async (req, res) => {
  try {
    const body = req.body || {};

    if (
      Object.keys(body).length === 0 &&
      (!req.files || Object.keys(req.files).length === 0)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "No form data received." });
    }

    // Defaults for missing personal info if logged in
    if (req.user) {
      body.firstName = body.firstName || req.user.firstName || req.user.name;
      body.lastName = body.lastName || req.user.lastName || "";
      body.email = body.email || req.user.email;
      body.phone = body.phone || req.user.phone;
    }

    // Required fields check
    const required = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "dateOfBirth",
      "gender",
      "idType",
      "idNumber",
      "bankAccount",
      "ifscCode",
      "address",
      "city",
      "state",
      "pincode",
      "termsAccepted",
      "privacyPolicyAccepted",
      "backgroundCheckConsent",
    ];
    const missing = required.filter(
      (f) => !body[f] || (typeof body[f] === "string" && body[f].trim() === ""),
    );

    const personalFields = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "dateOfBirth",
      "gender",
    ];
    const criticalMissing = missing.filter((m) => !personalFields.includes(m));

    if (criticalMissing.length) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        missing: criticalMissing,
      });
    }

    // Auto-fill test data if personal fields are missing (optional logic you had)
    if (missing.some((m) => personalFields.includes(m))) {
      body.firstName = body.firstName || "Host";
      body.lastName = body.lastName || "Applicant";
      body.email = body.email || `host-${Date.now()}@example.com`;
      body.phone = body.phone || "9999999999";
      body.dateOfBirth = body.dateOfBirth || "1990-01-01";
      body.gender = body.gender || "prefer-not-to-say";
    }

    // Boolean normalization
    const bool = (v) => v === true || v === "true" || v === "on" || v === "yes";
    body.termsAccepted = bool(body.termsAccepted);
    body.privacyPolicyAccepted = bool(body.privacyPolicyAccepted);
    body.backgroundCheckConsent = bool(body.backgroundCheckConsent);

    // ID normalization
    if (body.idType) {
      const map = {
        aadhaar: "aadhaar",
        aadhar: "aadhaar",
        pan: "pan",
        voter: "voter-id",
        "voter-id": "voter-id",
      };
      body.idType = map[body.idType.toLowerCase()] || body.idType;
    }
    if (!body.ifscCode && body.ifsc) body.ifscCode = body.ifsc;

    // Check duplicates
    const existingHost = await Host.findOne({
      $or: [
        { "personalInfo.email": body.email },
        { "personalInfo.phone": body.phone },
      ],
    });

    if (existingHost) {
      return res.status(400).json({
        success: false,
        message: "Application already exists",
        existingApplicationId: existingHost._id,
      });
    }

    const newHost = new Host({
      personalInfo: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        dateOfBirth: body.dateOfBirth,
        gender: body.gender,
      },
      identification: { idType: body.idType, idNumber: body.idNumber },
      bankDetails: { bankAccount: body.bankAccount, ifscCode: body.ifscCode },
      address: {
        address: body.address,
        city: body.city,
        state: body.state,
        pincode: body.pincode,
      },
      termsAccepted: body.termsAccepted,
      privacyPolicyAccepted: body.privacyPolicyAccepted,
      backgroundCheckConsent: body.backgroundCheckConsent,
      applicationStatus: "submitted",
    });

    if (newHost.updateVerificationProgress)
      newHost.updateVerificationProgress("personalInfo", true);

    await newHost.save();

    res.json({
      success: true,
      message: "Host registration submitted successfully!",
      applicationId: newHost._id,
      redirectUrl: "/admin/host-requests",
    });
  } catch (error) {
    console.error("Registration Error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: Object.values(error.errors).map((e) => e.message),
      });
    }
    res.status(500).json({ success: false, message: "Registration failed" });
  }
};

module.exports.handleDocumentUpload = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const host = await Host.findById(applicationId);
    if (!host)
      return res
        .status(404)
        .json({ success: false, message: "Host not found" });

    if (req.files) {
      Object.keys(req.files).forEach((fieldName) => {
        if (req.files[fieldName]?.[0]) {
          const file = req.files[fieldName][0];
          if (!host.documents) host.documents = {};
          host.documents[fieldName] = {
            filename: file.filename,
            path: file.path,
            uploadedAt: new Date(),
            verificationStatus: "pending",
          };
        }
      });
    }

    const requiredDocs = [
      "profilePhoto",
      "governmentId",
      "bankStatement",
      "addressProof",
    ];
    const uploadedDocs = host.documents
      ? Object.keys(host.documents).filter((d) => host.documents[d]?.filename)
      : [];

    if (requiredDocs.every((d) => uploadedDocs.includes(d))) {
      if (host.updateVerificationProgress)
        host.updateVerificationProgress("documents", true);
    }

    await host.save();

    res.json({
      success: true,
      message: "Documents uploaded",
      uploadedDocuments: Object.keys(req.files || {}),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Upload failed" });
  }
};

// ... (Keep your other get/verify controllers here, ensuring they have closing braces)

module.exports.getApplicationStatus = async (req, res) => {
  try {
    const host = await Host.findById(req.params.applicationId);
    if (!host)
      return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, application: host });
  } catch (e) {
    res.status(500).json({ success: false, message: "Error fetching status" });
  }
};

module.exports.checkEmailAvailability = async (req, res) => {
  try {
    const exists = await Host.findOne({ "personalInfo.email": req.body.email });
    res.json({
      success: !exists,
      message: exists ? "Email taken" : "Email available",
    });
  } catch (e) {
    res.status(500).json({ success: false, message: "Error" });
  }
};

module.exports.verifyPhone = async (req, res) => {
  try {
    const exists = await Host.findOne({ "personalInfo.phone": req.body.phone });
    res.json({
      success: !exists,
      message: exists ? "Phone taken" : "Phone available",
    });
  } catch (e) {
    res.status(500).json({ success: false, message: "Error" });
  }
};

module.exports.ifscLookup = async (req, res) => {
  res.json({
    success: true,
    data: { bank: "Mock Bank", branch: "Mock Branch" },
  });
};

module.exports.pincodeVerify = async (req, res) => {
  res.json({ success: true, data: { city: "Mock City", state: "Mock State" } });
};

module.exports.verifyGovernmentId = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "You must be logged in to do that." });
  }
  const host = await Host.findOne({ user: req.user._id });
  if (!host) return res.status(404).json({ success: false, message: "Host not found" });
  // Save files to host.documents
  if (req.files && req.files.idFront) {
    host.documents = host.documents || {};
    host.documents.idFront = {
      path: req.files.idFront[0].path,
      filename: req.files.idFront[0].filename,
      uploadedAt: new Date()
    };
  }
  if (req.files && req.files.idBack) {
    host.documents = host.documents || {};
    host.documents.idBack = {
      path: req.files.idBack[0].path,
      filename: req.files.idBack[0].filename,
      uploadedAt: new Date()
    };
  }
  // Set verification status to pending
  host.idVerification = host.idVerification || {};
  host.idVerification.status = "pending";
  host.idVerification.submittedAt = new Date();
  await host.save();
  res.json({ success: true, status: "pending" });
};

module.exports.getAllHostApplications = async (req, res) => {
  const apps = await Host.find().sort({ submittedAt: -1 }).limit(50);
  res.json({ success: true, applications: apps });
};

module.exports.updateApplicationStatus = async (req, res) => {
  try {
    await Host.findByIdAndUpdate(req.params.applicationId, {
      applicationStatus: req.body.status,
    });
    res.json({ success: true, message: "Updated" });
  } catch (e) {
    res.status(500).json({ success: false, message: "Error" });
  }
};

module.exports.completeOnboarding = async (req, res) => {
  try {
    const {
      hostFirstName,
      hostLastName,
      hostEmail,
      hostPhone,
      hostBio,
      propertyType,
      guests,
      title,
      price,
      cancellation,
      amenities,
    } = req.body;

    // Assuming user is logged in and req.user is available.
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "You must be logged in to do that." });
    }
    const owner = req.user._id;

    const newHost = new Host({
      personalInfo: {
        firstName: hostFirstName,
        lastName: hostLastName,
        email: hostEmail,
        phone: hostPhone,
        bio: hostBio,
      },
      user: owner,
      applicationStatus: "pending-approval",
      documents: {},
    });

    if (req.files && req.files.hostProfilePhoto) {
      newHost.documents.profilePhoto = {
        filename: req.files.hostProfilePhoto[0].filename,
        path: req.files.hostProfilePhoto[0].path,
        uploadedAt: new Date(),
        verificationStatus: "pending",
      };
    }

    if (req.session.uploadedIdFiles) {
      if (req.session.uploadedIdFiles.idFront) {
        newHost.documents.governmentIdFront = {
          filename: req.session.uploadedIdFiles.idFront.filename,
          path: req.session.uploadedIdFiles.idFront.path,
          uploadedAt: new Date(),
          verificationStatus: "pending",
        };
      }
      if (req.session.uploadedIdFiles.idBack) {
        newHost.documents.governmentIdBack = {
          filename: req.session.uploadedIdFiles.idBack.filename,
          path: req.session.uploadedIdFiles.idBack.path,
          uploadedAt: new Date(),
          verificationStatus: "pending",
        };
      }
    }

    await newHost.save();

    const newListing = new Listing({
      title,
      description: hostBio, // Using hostBio as listing description.
      price,
      propertyType,
      guests,
      cancellation,
      amenities,
      owner,
      host: newHost._id,
      // Leaving location, country, and geometry empty for now
      // as they are not provided in the form.
    });

    if (req.files && req.files.propertyImages) {
      newListing.images = req.files.propertyImages.map((f) => ({
        url: f.path,
        filename: f.filename,
      }));
    }

    // The form has a video upload, but the listing schema doesn't have a field for it.
    // I will ignore the video for now.

    await newListing.save();

    delete req.session.uploadedIdFiles;

    res.json({
      success: true,
      message: "Onboarding completed successfully!",
      hostId: newHost._id,
      listingId: newListing._id,
    });
  } catch (error) {
    console.error("Onboarding Error:", error);
    res.status(500).json({ success: false, message: "Onboarding failed" });
  }
};
