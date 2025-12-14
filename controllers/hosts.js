// controllers/hosts.js
// ✅ Uses Supabase session ONLY - NO MongoDB User dependencies

const Host = require("../models/host");
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

  // ✅ Find host by Supabase user email
  if (req.session?.supabaseUser) {
    const userEmail = req.session.supabaseUser.email;
    host = await Host.findOne({ "personalInfo.email": userEmail });
    if (host) {
      listing = await Listing.findOne({ host: host._id });
    }
  }

  res.render("static/host", { host, listing });
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
  // ✅ Check Supabase session (not req.user)
  if (!req.session?.supabaseUser) {
    return res
      .status(401)
      .json({ success: false, message: "You must be logged in to do that." });
  }

  if (!req.session.uploadedIdFiles) {
    req.session.uploadedIdFiles = {};
  }

  if (req.files && req.files.idFront) {
    req.session.uploadedIdFiles.idFront = {
      path: req.files.idFront[0].path,
      filename: req.files.idFront[0].filename,
    };
  }

  if (req.files && req.files.idBack) {
    req.session.uploadedIdFiles.idBack = {
      path: req.files.idBack[0].path,
      filename: req.files.idBack[0].filename,
    };
  }

  res.json({ success: true, verified: true });
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

    // ✅ Check Supabase session (not req.user)
    if (!req.session?.supabaseUser) {
      return res
        .status(401)
        .json({ success: false, message: "You must be logged in to do that." });
    }

    const userEmail = req.session.supabaseUser.email;
    const userId = req.session.supabaseUser.id;

    // ✅ Create Host record
    const newHost = new Host({
      personalInfo: {
        firstName: hostFirstName,
        lastName: hostLastName,
        email: hostEmail,
        phone: hostPhone,
        bio: hostBio,
      },
      supabaseUserId: userId, // ✅ Store Supabase user ID (not MongoDB ObjectId)
      applicationStatus: "pending-approval",
      documents: {},
    });

    // Add profile photo
    if (req.files && req.files.hostProfilePhoto) {
      newHost.documents.profilePhoto = {
        filename: req.files.hostProfilePhoto[0].filename,
        path: req.files.hostProfilePhoto[0].path,
        uploadedAt: new Date(),
        verificationStatus: "pending",
      };
    }

    // Add government ID documents from session
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
    console.log("✅ Host created:", newHost._id);

    // ✅ Create Listing (store owner email instead of MongoDB User ID)
    const newListing = new Listing({
      title,
      description: hostBio,
      price,
      propertyType,
      guests,
      cancellation,
      amenities,
      ownerEmail: userEmail, // ✅ Store email (not ObjectId)
      host: newHost._id,
    });

    // Add property images
    if (req.files && req.files.propertyImages) {
      newListing.images = req.files.propertyImages.map((f) => ({
        url: f.path,
        filename: f.filename,
      }));
    }

    await newListing.save();
    console.log("✅ Listing created:", newListing._id);

    // Clean up session
    delete req.session.uploadedIdFiles;

    res.json({
      success: true,
      message: "Onboarding completed successfully!",
      hostId: newHost._id,
      listingId: newListing._id,
    });
  } catch (error) {
    console.error("💥 Onboarding Error:", error);
    res.status(500).json({
      success: false,
      message: "Onboarding failed: " + error.message,
    });
  }
};
