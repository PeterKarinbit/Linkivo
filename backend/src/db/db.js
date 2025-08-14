import 'dotenv/config';
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js"
const MONGODB_URL = process.env.MONGODB_URL

export const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(MONGODB_URL, {
            serverSelectionTimeoutMS: 5000, // Reduce timeout for faster feedback during connection issues
            heartbeatFrequencyMS: 2000,     // More frequent heartbeats
        })
        console.log(`MONGODB Connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGODB Connection error:", error.message);
        console.log("Connection string (without credentials):", MONGODB_URL?.replace(/:\/\/[^@]+@/, "://***:***@"));
        process.exit(1)
    }
}