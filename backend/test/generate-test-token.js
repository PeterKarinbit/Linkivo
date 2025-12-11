
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// Load env vars
dotenv.config({ path: '../.env' }); // Assuming run from backend/test/
dotenv.config(); // Fallback to current dir

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || process.env.MONGODB_URL;
        if (!uri) throw new Error("Missing MONGODB_URI or MONGODB_URL in .env");
        await mongoose.connect(uri);
        console.log("✅ Connected to MongoDB");
    } catch (error) {
        console.error("❌ DB Connection Error:", error.message);
        process.exit(1);
    }
};

const generateToken = async () => {
    await connectDB();

    try {
        // Dynamic import to avoid issues if model file structure changes
        const { User } = await import('../src/models/user.model.js');

        // Allow passing username/email as arg, otherwise list recent
        const targetIdentifier = process.argv[2];

        let user;
        if (targetIdentifier) {
            user = await User.findOne({
                $or: [{ email: targetIdentifier }, { username: targetIdentifier }]
            });
        } else {
            console.log("ℹ️  No user specified. Fetching most recent user...");
            user = await User.findOne().sort({ createdAt: -1 });
        }

        if (!user) {
            console.error(targetIdentifier ? `❌ User '${targetIdentifier}' not found.` : "❌ No users found in database.");
            process.exit(1);
        }

        console.log(`\nFound User: ${user.username} (${user.email}) [ID: ${user._id}]`);

        // Generate Token manually to ensure we use the same secret as the app
        const secret = process.env.ACCESS_TOKEN_SECRET;
        if (!secret) {
            console.error("❌ ACCESS_TOKEN_SECRET is missing in .env");
            process.exit(1);
        }

        const token = jwt.sign(
            {
                _id: user._id,
                email: user.email,
                username: user.username,
                fullName: user.userProfile?.name || "Test User"
            },
            secret,
            { expiresIn: '24h' }
        );

        console.log("\n🔑 GENERATED TEST TOKEN (Legacy JWT):");
        console.log("----------------------------------------");
        console.log(token);
        console.log("----------------------------------------");
        console.log("\n📋 Usage via Curl:");
        console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:3000/api/v1/users/profile`);
        console.log("\n📋 Usage in Postman:");
        console.log("Authorization Type: Bearer Token");
        console.log("Token: <paste object above>");

    } catch (error) {
        console.error("❌ Error generating token:", error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

generateToken();
