
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { createClerkClient, verifyToken } from '@clerk/express';

// Initialize Clerk Client manually since singleton export seems flaky in this environment
const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY
});

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        // Support token from cookie, Authorization header, or query param (for SSE/EventSource)
        let token = req.cookies?.accessToken || req.cookies?.__session;

        if (!token) {
            const authHeader = req.header("Authorization");
            if (authHeader) {
                if (authHeader.startsWith("Bearer ")) {
                    token = authHeader.substring(7);
                } else {
                    token = authHeader;
                }
            }
        }

        if (!token && req.query?.token) {
            token = String(req.query.token).trim();
        }

        if (!token) {
            console.log("[AuthMiddleware] No token provided in headers or cookies");
            throw new ApiError(401, "Unauthorized request");
        }

        let user;
        let isClerkToken = false;

        // Try verifying as Clerk JWT first
        try {
            // Attempt to verify with Clerk using the standalone verifyToken
            const clerkSession = await verifyToken(token, {
                secretKey: process.env.CLERK_SECRET_KEY
            });

            if (clerkSession) {
                isClerkToken = true;
                const clerkUserId = clerkSession.sub;

                // Find user by Clerk ID
                user = await User.findOne({ clerkId: clerkUserId }).select("-password -refreshToken");

                // If no user found, try to create from Clerk data
                if (!user) {
                    console.log("[AuthMiddleware] User not found in DB. Fetching from Clerk API...");
                    const clerkUser = await clerkClient.users.getUser(clerkUserId);

                    // Create user from Clerk data
                    user = await User.create({
                        clerkId: clerkUserId,
                        email: clerkUser.emailAddresses[0].emailAddress,
                        username: clerkUser.username || clerkUser.emailAddresses[0].emailAddress.split('@')[0],
                        role: "jobSeeker",
                        userProfile: {
                            name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'New User',
                            profilePicture: clerkUser.imageUrl || '',
                            doneOnboarding: false
                        }
                    });
                    console.log("[AuthMiddleware] User created in DB:", user._id);
                }
            }
        } catch (clerkError) {
            console.warn("[AuthMiddleware] Clerk verification failed:", clerkError.message);

            // Debug: Check if secret key is present
            if (!process.env.CLERK_SECRET_KEY) {
                console.error("[AuthMiddleware] CRITICAL: CLERK_SECRET_KEY is missing in backend env!");
            }

            // Not a Clerk token, try legacy JWT
            try {
                const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
                user = await User.findById(decodedToken?._id).select("-password -refreshToken");

                if (!user) {
                    console.error("[AuthMiddleware] Legacy JWT valid but user not found");
                    throw new ApiError(401, "Invalid Access Token");
                }
            } catch (err) {
                if (err.name === "TokenExpiredError") {
                    throw new ApiError(401, "TokenExpiredError");
                }
                console.error("[AuthMiddleware] Legacy verification failed:", err.message);
                throw new ApiError(401, "Invalid Access Token");
            }
        }

        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }

        req.user = user;
        req.isClerkAuth = isClerkToken;
        next();
    } catch (error) {
        // If error is already an ApiError, just throw it
        if (error instanceof ApiError) throw error;
        throw new ApiError(401, error.message || "Unauthorized");
    }
});