const mongoose = require("mongoose");

async function cleanupUsersIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL || "mongodb://localhost:27017/HomyHive", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");

    // Get the users collection
    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");

    // List all indexes
    const indexes = await usersCollection.listIndexes().toArray();
    console.log("Current indexes:", indexes.map(i => i.name));

    // Drop the username_1 index if it exists
    try {
      await usersCollection.dropIndex("username_1");
      console.log("✓ Dropped username_1 index");
    } catch (e) {
      console.log("✓ username_1 index doesn't exist");
    }

    // List updated indexes
    const updatedIndexes = await usersCollection.listIndexes().toArray();
    console.log("Updated indexes:", updatedIndexes.map(i => i.name));

    console.log("✅ Cleanup complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

cleanupUsersIndex();
