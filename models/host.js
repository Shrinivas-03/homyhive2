// FILE: E:\homyhive2\models\host.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// ... (Paste your existing Schema definition here: personalInfo, identification, etc.) ...
// I am assuming you have the schema code. If not, paste your schema and I will wrap it.

const hostSchema = new Schema(
  {
    personalInfo: {
      firstName: String,
      lastName: String,
      email: {
        type: String,
        sparse: true,
        default: null,
      },
      phone: {
        type: String,
        sparse: true, // Allow multiple null values
        default: null,
      },
      dateOfBirth: String,
      gender: String,
      bio: String,
    },
    address: {
      address: String,
      city: String,
      state: String,
      pinCode: String,
    },
    identification: {
      idType: String,
      idNumber: String,
      idFront: String,
      idBack: String,
    },
    bankDetails: {
      accountHolder: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      branchName: String,
    },
    // ... add the rest of your schema fields here
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    supabaseUserId: {
      type: String,
      unique: true,
      sparse: true, // Allow null for backward compatibility
    },
    applicationStatus: { type: String, default: "submitted" },
    documents: { type: Object, default: {} },
    idVerification: {
      status: {
        type: String,
        enum: ["not_submitted", "pending", "verified", "rejected"],
        default: "not_submitted",
      },
      submittedAt: Date,
      verifiedAt: Date,
      rejectedAt: Date,
      reason: String,
    },
    bankVerification: {
      status: {
        type: String,
        enum: ["not_verified", "pending", "verified", "rejected"],
        default: "not_verified",
      },
      submittedAt: Date,
      verifiedAt: Date,
      rejectedAt: Date,
      reason: String,
    },
    canCreateProperty: {
      type: Boolean,
      default: false,
    },
    propertyDetails: {
      title: String,
      description: String,
      propertyType: String,
      guests: String,
      price: Number,
      cancellation: String,
      amenities: [String],
    },
    location: {
      address: String,
      latitude: {
        type: Number,
        default: null,
      },
      longitude: {
        type: Number,
        default: null,
      },
      mapUrl: String,
    },
    identification: {
      idType: String,
      idNumber: String,
      idFrontFile: String,
      idBackFile: String,
      submittedAt: Date,
    },
    bankDetails: {
      accountHolder: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      branchName: String,
      verifiedAt: Date,
    },
  },
  { timestamps: true },
);

hostSchema.methods.getVerificationPercentage = function () {
  let percentage = 0;
  if (
    this.personalInfo.firstName &&
    this.personalInfo.lastName &&
    this.personalInfo.email &&
    this.personalInfo.phone
  ) {
    percentage += 25;
  }
  if (this.idVerification.status === "verified") {
    percentage += 25;
  }
  if (this.bankVerification.status === "verified") {
    percentage += 25;
  }
  if (
    this.documents.profilePhoto &&
    this.documents.governmentId &&
    this.documents.bankStatement &&
    this.documents.addressProof
  ) {
    percentage += 25;
  }
  return percentage;
};

// --- THE CRITICAL FIX IS BELOW ---

// Check if model exists before compiling to prevent OverwriteModelError
const Host = mongoose.models.Host || mongoose.model("Host", hostSchema);

module.exports = Host;
