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
      email: String,
      phone: String,
      dateOfBirth: String,
      gender: String,
    },
    // ... add the rest of your schema fields here
    applicationStatus: { type: String, default: "submitted" },
    documents: { type: Object, default: {} },
  },
  { timestamps: true },
);

// --- THE CRITICAL FIX IS BELOW ---

// Check if model exists before compiling to prevent OverwriteModelError
const Host = mongoose.models.Host || mongoose.model("Host", hostSchema);

module.exports = Host;
