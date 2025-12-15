const mongoose = require("mongoose");

async function dropUsersIndex() {
  try {
    await mongoose.connect(process.env.MONGO_URL || "mongodb://localhost:27017/HomyHive");
    
    const db = mongoose.connection.db;
    
    // Drop the collection to remove all bad indexes
    try {
      await db.collection("users").drop();
      console.log("✓ Dropped users collection");
    } catch (e) {
      console.log("Users collection doesn't exist or already cleaned");
    }
    
    console.log("✅ Cleanup complete!");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

dropUsersIndex();
