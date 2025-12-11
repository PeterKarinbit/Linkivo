import 'dotenv/config';
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js"
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL; // Support both URI and URL for backward compatibility

export const connectDB = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        if (!MONGODB_URI) {
            throw new Error('MongoDB connection string is not defined in environment variables');
        }
        const connectionInstance = await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 30000, // Increased to 30 seconds
            socketTimeoutMS: 45000,          // Wait 45 seconds before timing out
            connectTimeoutMS: 30000,         // Wait 30 seconds for connection
            heartbeatFrequencyMS: 10000,     // Heartbeat every 10 seconds
            retryWrites: true,
            retryReads: true,
            maxPoolSize: 10,                // Maximum number of connections in the connection pool
        });
        
        console.log(`✅ MONGODB Connected! DB HOST: ${connectionInstance.connection.host}`);
        console.log(`📊 Database Name: ${connectionInstance.connection.name}`);
        
        // Connection events for better debugging
        mongoose.connection.on('connected', () => {
            console.log('Mongoose connected to DB');
        });
        
        mongoose.connection.on('error', (err) => {
            console.error('Mongoose connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.warn('Mongoose disconnected from DB');
        });
        
        return connectionInstance;
    } catch (error) {
        console.error("❌ MONGODB Connection failed:", error.message);
        console.log("Connection string (without credentials):", MONGODB_URL?.replace(/:\/\/[^@]+@/, "://***:***@"));
        console.log("\nTroubleshooting tips:");
        console.log("1. Check if your MongoDB Atlas cluster is running");
        console.log("2. Verify your IP is whitelisted in MongoDB Atlas Network Access");
        console.log("3. Check your database user credentials");
        console.log("4. Ensure your internet connection is stable");
        
        process.exit(1);
    }
}