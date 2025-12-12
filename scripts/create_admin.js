const mongoose = require('mongoose');
const User = require('../models/user');

require('dotenv').config();

const dbUrl = process.env.ATLASDB_URL || 'mongodb://127.0.0.1:27017/homyhive';

async function main() {
    await mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to DB');

    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
        console.error('Usage: node create_admin.js <email> <password>');
        process.exit(1);
    }

    let user = await User.findOne({ email });
    if (!user) {
        console.log('User not found, creating...');
        user = new User({ username: email, email });
        await User.register(user, password);
    } else {
        console.log('User exists, ensuring password (will reset)');
        // setPassword is provided by passport-local-mongoose
        await user.setPassword(password);
        await user.save();
    }

    user.isAdmin = true;
    await user.save();

    console.log(`Admin user ready: ${email}`);
    mongoose.connection.close();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
