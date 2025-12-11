
import dotenv from 'dotenv';
dotenv.config();

console.log("Checking Environment Variables...");
console.log("CLERK_SECRET_KEY present:", !!process.env.CLERK_SECRET_KEY);
if (process.env.CLERK_SECRET_KEY) {
    console.log("CLERK_SECRET_KEY length:", process.env.CLERK_SECRET_KEY.length);
    console.log("CLERK_SECRET_KEY prefix:", process.env.CLERK_SECRET_KEY.substring(0, 7));
} else {
    console.log("CLERK_SECRET_KEY is MISSING");
}
console.log("CLERK_PUBLISHABLE_KEY present:", !!process.env.CLERK_PUBLISHABLE_KEY);

console.log("\nChecking Clerk Import...");
try {
    const clerk = await import('@clerk/express');
    console.log("Imported @clerk/express successfully");
    console.log("clerkClient available:", !!clerk.clerkClient);
    console.log("verifyToken method available:", !!(clerk.clerkClient && clerk.clerkClient.verifyToken));
} catch (e) {
    console.error("Failed to import @clerk/express:", e.message);
}
