
import dotenv from 'dotenv';
dotenv.config();

import { clerkClient } from '@clerk/express';

console.log("Inspecting clerkClient keys:");
console.log(Object.keys(clerkClient));

console.log("\nInspecting clerkClient prototype keys (if any):");
if (Object.getPrototypeOf(clerkClient)) {
    console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(clerkClient)));
}

// Check for deep properties
console.log("\nclerkClient.verifyToken:", clerkClient.verifyToken);
console.log("clerkClient.sessions?.verifyToken:", clerkClient.sessions?.verifyToken);
