// Fix MongoDB indexes for hosts collection
const mongoose = require("mongoose");
require("dotenv").config();

async function fixIndexes() {
  try {
    console.log("Connecting to MongoDB...");
    const mongoUri = process.env.ATLASDB_URL || process.env.MONGODB_URI;
    console.log("URI:", mongoUri ? "✓ Found" : "✗ Not found");
    
    if (!mongoUri) {
      console.error("❌ ATLASDB_URL or MONGODB_URI not found in .env");
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri);
    console.log("Connected!");

    const db = mongoose.connection.db;
    const hostsCollection = db.collection("hosts");

    // Get current indexes
    console.log("\n📋 Current indexes:");
    const indexes = await hostsCollection.listIndexes().toArray();
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    // Drop the bad unique index on personalInfo.email if it exists
    try {
      console.log("\n🗑️  Dropping unique index on personalInfo.email...");
      await hostsCollection.dropIndex("personalInfo.email_1");
      console.log("✓ Dropped personalInfo.email_1");
    } catch (e) {
      if (e.message.includes("index not found")) {
        console.log("✓ Index personalInfo.email_1 doesn't exist (already dropped)");
      } else {
        console.error("Error dropping index:", e.message);
      }
    }

    // Drop the bad unique index on personalInfo.phone if it exists
    try {
      console.log("\n🗑️  Dropping unique index on personalInfo.phone...");
      await hostsCollection.dropIndex("personalInfo.phone_1");
      console.log("✓ Dropped personalInfo.phone_1");
    } catch (e) {
      if (e.message.includes("index not found")) {
        console.log("✓ Index personalInfo.phone_1 doesn't exist (already dropped)");
      } else {
        console.error("Error dropping index:", e.message);
      }
    }

    // Get updated indexes
    console.log("\n📋 Updated indexes:");
    const newIndexes = await hostsCollection.listIndexes().toArray();
    newIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    console.log("\n✅ Index fix complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

fixIndexes();
