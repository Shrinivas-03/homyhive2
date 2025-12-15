const mongoose = require("mongoose");

async function dropDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URL || "mongodb://localhost:27017/HomyHive");
    
    const db = mongoose.connection.db;
    
    // Drop the entire database
    await db.dropDatabase();
    console.log("✅ Database dropped successfully!");
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

dropDatabase();
