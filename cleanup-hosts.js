// Delete duplicate host records for testing
const mongoose = require("mongoose");
require("dotenv").config();
const Host = require("./models/host");

async function cleanup() {
  try {
    const mongoUri = process.env.ATLASDB_URL || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Find all hosts with email murudanagashree@gmail.com
    const duplicates = await Host.find({ "personalInfo.email": "murudanagashree@gmail.com" });
    console.log(`Found ${duplicates.length} hosts with email murudanagashree@gmail.com:`);
    duplicates.forEach(h => {
      console.log(`  - ${h._id}: supabaseUserId=${h.supabaseUserId}, email=${h.personalInfo?.email}`);
    });

    // Keep only the one with the correct supabaseUserId
    const correctUserId = "bd290628-9079-4f88-bfe7-47bc4f972585";
    for (const host of duplicates) {
      if (host.supabaseUserId !== correctUserId) {
        console.log(`Deleting host ${host._id} (wrong supabaseUserId)`);
        await Host.deleteOne({ _id: host._id });
      }
    }

    console.log("✅ Cleanup complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

cleanup();
