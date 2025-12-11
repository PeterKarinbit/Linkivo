
import dotenv from 'dotenv';
dotenv.config();
import { createClerkClient, verifyToken } from '@clerk/express';

console.log("Creating client...");
const client = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

console.log("Client keys:", Object.keys(client));
console.log("Client users:", !!client.users);
console.log("Client verifyToken:", !!client.verifyToken);

console.log("Exported verifyToken:", !!verifyToken);
