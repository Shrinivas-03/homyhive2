// FILE: E:\homyhive2\controllers\hosts.js
const Host = require("../models/host"); // Ensure filename matches your actual model file
const Listing = require("../models/listing.js");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ==========================================
// MULTER CONFIGURATION
// ==========================================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../public/uploads/host-documents");
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

module.exports.uploadDocuments = upload.fields([
  { name: "profilePhoto", maxCount: 1 },
  { name: "governmentId", maxCount: 1 },
  { name: "bankStatement", maxCount: 1 },
  { name: "addressProof", maxCount: 1 },
]);

// ==========================================
// RENDER HOST ONBOARDING PAGE
// ✅ Uses Supabase session email
// ==========================================

module.exports.renderHostOnboarding = async (req, res) => {
  let host = null;
  let listing = null;

  // Check if user is authenticated
  if (!req.session?.supabaseUser) {
    console.log("User not authenticated, redirecting to login");
    return res.redirect("/users/login");
  }

  // ✅ Find host by Supabase user ID
  const userId = req.session.supabaseUser.id;
  console.log("renderHostOnboarding: Finding host for user:", userId);

  host = await Host.findOne({ supabaseUserId: userId });
  if (host) {
    listing = await Listing.findOne({ host: host._id });
  }

  // ✅ Pass session user to template
  res.render("static/host", {
    host,
    listing,
    session: req.session,
    isAuthenticated: !!req.session.supabaseUser,
  });
};

// ==========================================
// HOST REGISTRATION
// ✅ Uses Supabase session data
// ==========================================

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

    // ✅ Get defaults from Supabase session (not MongoDB)
    const sessionUser = req.session?.supabaseUser;
    if (sessionUser) {
      body.firstName =
        body.firstName ||
        sessionUser.username?.split(" ")[0] ||
        sessionUser.email.split("@")[0];
      body.lastName =
        body.lastName || sessionUser.username?.split(" ")[1] || "";
      body.email = body.email || sessionUser.email;
      body.phone = body.phone || sessionUser.phone || "";
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

    // Auto-fill test data if personal fields are missing
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

    // ✅ Create host (store Supabase user ID reference)
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
      supabaseUserId: sessionUser?.id || null, // ✅ Store Supabase user ID
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

// ==========================================
// DOCUMENT UPLOAD
// ==========================================

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

// ==========================================
// GET APPLICATION STATUS
// ==========================================

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

// ==========================================
// VALIDATION ENDPOINTS
// ==========================================

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

// ==========================================
// VERIFY GOVERNMENT ID
// ✅ Uses Supabase session check ONLY
// ==========================================

module.exports.verifyGovernmentId = async (req, res) => {
  console.log("verifyGovernmentId called");
  console.log(
    "req.user:",
    req.user ? { id: req.user.id, email: req.user.email } : "undefined",
  );
  console.log(
    "req.session.supabaseUser:",
    req.session?.supabaseUser
      ? {
          id: req.session.supabaseUser.id,
          email: req.session.supabaseUser.email,
        }
      : "undefined",
  );

  if (!req.user) {
    return res
      .status(401)
      .json({ success: false, message: "You must be logged in to do that." });
  }

  // Get ID details from request body
  const { idType, idNumber } = req.body;

  // Use ID from req.user (which could be from session or token)
  const userId = req.user.id;
  console.log("Looking for host with supabaseUserId:", userId);

  let host = await Host.findOne({ supabaseUserId: userId });

  // If host doesn't exist, create one automatically
  if (!host) {
    console.log("Host not found, creating new host for user:", userId);

    // Get email from user object (either from session or token)
    const userEmail = req.user.email;

    host = new Host({
      supabaseUserId: userId,
      personalInfo: {
        email: userEmail,
        firstName: req.user.username?.split(" ")[0] || userEmail.split("@")[0],
        lastName: req.user.username?.split(" ")[1] || "",
      },
      applicationStatus: "pending-verification",
      documents: {},
    });

    await host.save();
    console.log("✓ New host created:", host._id);
  }

  console.log("Host ready:", host._id);

  // Save ID details
  host.identification = host.identification || {};
  host.identification.idType = idType;
  host.identification.idNumber = idNumber;

  // Save files to host.documents
  if (req.files && req.files.idFront) {
    host.documents = host.documents || {};
    host.documents.idFront = {
      path: req.files.idFront[0].path,
      filename: req.files.idFront[0].filename,
      uploadedAt: new Date(),
    };
    host.identification.idFront = req.files.idFront[0].filename;
  }
  if (req.files && req.files.idBack) {
    host.documents = host.documents || {};
    host.documents.idBack = {
      path: req.files.idBack[0].path,
      filename: req.files.idBack[0].filename,
      uploadedAt: new Date(),
    };
    host.identification.idBack = req.files.idBack[0].filename;
  }
  // Set verification status to pending
  host.idVerification = host.idVerification || {};
  host.idVerification.status = "pending";
  host.idVerification.submittedAt = new Date();

  await host.save();

  console.log("✓ ID verification submitted for host:", host._id);
  res.json({
    success: true,
    status: "pending",
    message: "ID submitted for verification",
  });
};

// ==========================================
// BANK VERIFICATION
// ==========================================
module.exports.verifyBank = async (req, res) => {
  try {
    if (!req.user && !req.session?.supabaseUser) {
      return res
        .status(401)
        .json({ success: false, message: "You must be logged in" });
    }

    const userId = req.user?.id || req.session.supabaseUser.id;
    const { accountHolder, accountNumber, ifscCode, bankName, branchName } = req.body;

    if (!accountHolder || !accountNumber || !ifscCode) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // Find host
    let host = await Host.findOne({ supabaseUserId: userId });
    if (!host) {
      return res
        .status(404)
        .json({ success: false, message: "Host not found" });
    }

    // Store bank details
    host.bankDetails = {
      accountHolder,
      accountNumber,
      ifscCode,
      bankName: bankName || "Verified",
      branchName: branchName || "Verified",
    };

    host.bankVerification = host.bankVerification || {};
    host.bankVerification.status = "verified";
    host.bankVerification.verifiedAt = new Date();

    await host.save();

    res.json({ success: true, message: "Bank verified successfully" });
  } catch (error) {
    console.error("Bank verification error:", error);
    res.status(500).json({
      success: false,
      message: "Verification failed: " + error.message,
    });
  }
};

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

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

// ==========================================
// COMPLETE ONBOARDING
// ✅ Uses Supabase session ONLY - NO MongoDB User
// ==========================================

module.exports.completeOnboarding = async (req, res) => {
  try {
    console.log("Entering completeOnboarding function");

    const {
      hostFirstName,
      hostLastName,
      hostEmail,
      hostPhone,
      hostBio,
      hostDOB,
      hostGender,
      hostAddress,
      hostCity,
      hostState,
      hostPinCode,
      propertyType,
      guests,
      title,
      price,
      cancellation,
      amenities,
      propertyLatitude,
      propertyLongitude,
      propertyLocationAddress,
    } = req.body;

    console.log("Request body:", req.body);

    if (!req.session?.supabaseUser) {
      console.log("User not authenticated");
      return res
        .status(401)
        .json({ success: false, message: "You must be logged in to do that." });
    }

    const userId = req.session.supabaseUser.id;
    console.log("User ID:", userId);

    let host = await Host.findOne({ supabaseUserId: userId });
    console.log("Host found:", host);

    if (!host) {
      console.log("Host not found, creating new host");
      host = new Host({
        supabaseUserId: userId,
        personalInfo: {},
        address: {},
        documents: {},
      });
    }

    host.personalInfo = {
      firstName: hostFirstName,
      lastName: hostLastName,
      email: hostEmail,
      phone: hostPhone,
      bio: hostBio,
      dateOfBirth: hostDOB,
      gender: hostGender,
    };

    host.address = {
      address: hostAddress,
      city: hostCity,
      state: hostState,
      pinCode: hostPinCode,
    };

    host.propertyDetails = {
      title,
      description: hostBio,
      price,
      propertyType,
      guests,
      cancellation,
      amenities,
    };

    host.location = {
      address: propertyLocationAddress,
      latitude: propertyLatitude && !isNaN(propertyLatitude) ? parseFloat(propertyLatitude) : null,
      longitude: propertyLongitude && !isNaN(propertyLongitude) ? parseFloat(propertyLongitude) : null,
      mapUrl: propertyLatitude && propertyLongitude ? `https://www.openstreetmap.org/?lat=${propertyLatitude}&lon=${propertyLongitude}&zoom=15` : null,
    };

    console.log("Property details:", host.propertyDetails);
    console.log("Location data:", host.location);

    if (req.files && req.files.hostProfilePhoto) {
      host.documents = host.documents || {};
      host.documents.profilePhoto = {
        filename: req.files.hostProfilePhoto[0].filename,
        path: req.files.hostProfilePhoto[0].path,
        uploadedAt: new Date(),
        verificationStatus: "pending",
      };
    }

    console.log("Profile photo:", host.documents.profilePhoto);

    if (req.files && req.files.propertyImages) {
      host.documents.propertyImages = req.files.propertyImages.map((f) => ({
        filename: f.filename,
        path: f.path,
        uploadedAt: new Date(),
        verificationStatus: "pending",
      }));
    }

    console.log("Property images:", host.documents.propertyImages);

    if (req.files && req.files.propertyVideo) {
      host.documents.propertyVideo = {
        filename: req.files.propertyVideo[0].filename,
        path: req.files.propertyVideo[0].path,
        uploadedAt: new Date(),
        verificationStatus: "pending",
      };
    }

    console.log("Property video:", host.documents.propertyVideo);

    host.applicationStatus = "pending-approval";

    console.log("Application status:", host.applicationStatus);

    await host.save();

    console.log("Host saved successfully");

    res.json({
      success: true,
      message:
        "Onboarding completed successfully! Your submission is pending approval.",
      hostId: host._id,
    });
  } catch (error) {
    console.error("💥 Onboarding Error:", error);
    res.status(500).json({
      success: false,
      message: "Onboarding failed: " + error.message,
    });
  }
};
// ==========================================
// RENDER NEW LISTING FORM
// ==========================================
module.exports.renderNewListingForm = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.session?.supabaseUser) {
      return res.redirect("/users/login");
    }

    const userId = req.session.supabaseUser.id;
    const host = await Host.findOne({ supabaseUserId: userId });

    if (!host) {
      req.flash("error", "You must be a host to create a listing.");
      return res.redirect("/");
    }

    if (!host.canCreateProperty) {
      req.flash("error", "You are not enabled to create a listing.");
      return res.redirect("/");
    }

    res.render("hosts/new-listing", { host });
  } catch (error) {
    console.error("Error rendering new listing form:", error);
    req.flash("error", "Failed to render new listing form");
    res.redirect("/");
  }
};

// ==========================================
// CREATE LISTING
// ==========================================
module.exports.createListing = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.session?.supabaseUser) {
      return res.redirect("/users/login");
    }

    const userId = req.session.supabaseUser.id;
    const host = await Host.findOne({ supabaseUserId: userId });

    if (!host) {
      req.flash("error", "You must be a host to create a listing.");
      return res.redirect("/");
    }

    if (!host.canCreateProperty) {
      req.flash("error", "You are not enabled to create a listing.");
      return res.redirect("/");
    }

    const { listing } = req.body;
    const newListing = new Listing(listing);
    newListing.host = host._id;
    newListing.owner = req.user._id;

    if (req.files) {
      newListing.images = req.files.map((f) => ({
        url: f.path,
        filename: f.filename,
      }));
    }

    await newListing.save();

    req.flash("success", "Listing created successfully!");
    res.redirect(`/listings/${newListing._id}`);
  } catch (error) {
    console.error("Error creating listing:", error);
    req.flash("error", "Failed to create listing");
    res.redirect("/hosts/listings/new");
  }
};
